# Replace Google Drive with Supabase Storage + namespaced Postgres

## Goal

`/admin/drive` currently browses a Google Drive folder via a service-account client (`src/lib/gdrive.ts`) with six API routes and no database. Replace it with:

- **File bytes** in a private Supabase Storage bucket.
- **Drive metadata** (folder tree, names, sizes, soft-delete state) in a dedicated Postgres namespace — schema `chaenix` — inside a shared Supabase database.
- No Google Drive code, no `googleapis` dependency, no `GDRIVE_*` env vars.

## Decisions (confirmed)

| Topic | Decision |
|---|---|
| Scope | Drive only. Dexie/IndexedDB chat storage (`src/lib/chat-client-store.ts`) is **unchanged**. |
| Access | Hosted supabase.com project. `@supabase/supabase-js` server-only client with the service role key; `db: { schema: "chaenix" }`. No Supabase key reaches the browser. |
| Names | Postgres schema `chaenix`, private bucket `drive`, table `chaenix.drive_entries`. |
| Env | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_SCHEMA` (default `chaenix`), `SUPABASE_STORAGE_BUCKET` (default `drive`). |
| Transport | Server-proxied through route handlers (upload buffers in the route, download streams a server-generated signed URL). |
| Delete | Soft delete via `deleted_at` + a Trash view with Restore and Delete forever. |
| Trash listing | Only **top-level trash roots**, read from a `chaenix.drive_trash` view; a trashed folder shows as one row, not one row per descendant. |
| Restore conflicts | Restore **fails with a 409** naming the conflicting live item. No auto-rename. |
| Folder restore | Restore clears `deleted_at` only for rows stamped by that same delete, so a child deleted separately earlier stays in Trash. |
| Route | Keep `/admin/drive`; change the sidebar label from "Drive" to "Storage". |
| Migration artifact | `db/sql/0001_chaenix_drive.sql`, applied by hand. Deliberately outside `supabase/` so the Supabase CLI can never `db push` it against the shared database. |
| Existing data | No migration. Bucket and table start empty. |

### Consequential decisions

- **Object keys are id-based**: a file's object lives at `objects/{entryId}`; the display name lives only in `drive_entries.name`. Rename and move are metadata-only updates — no copy/delete, no bucket name collisions. The original filename is duplicated into the object's `metadata` for dashboard readability. Folders are metadata-only rows, so empty folders persist (unlike raw prefixes).
- **Timestamps are the delete identity**: `drive_soft_delete` applies one `now()` to the whole subtree and skips rows that are already trashed, so `deleted_at` identifies *which delete* trashed a row. `drive_restore` clears only rows matching the target's own `deleted_at`. Independently-trashed descendants keep their older timestamp and reappear as their own trash roots once the parent is live again. Purging a folder still destroys everything inside it.
- **Pagination** keeps the `nextPageToken` wire contract, implemented as a base64url offset cursor (page size 50). Caveat: an offset window can shift if rows are inserted while paging.
- **Sorting is server-side**: files view = folders first, then `name asc` | `updated_at desc` | `size_bytes desc nulls last`; trash view = `deleted_at desc`.
- **Subtree operations (soft delete, restore, purge, move) are Postgres functions** called via `supabase.rpc(...)`, because recursive CTEs cannot be expressed through PostgREST filters.
- **`parent_id` uses `on delete cascade`**, so purge deletes only the root row and the database removes the subtree atomically, instead of ordering a multi-row delete to satisfy a `restrict` constraint.

## Prerequisite state

Verified in the repo:

- `googleapis@^178.0.0` is used **only** by `src/lib/gdrive.ts`; `dexie` is unrelated to the drive.
- `@supabase/supabase-js` and `server-only` are **not** installed.
- Next.js `16.3.3`; `export const runtime = "nodejs"` and `export const maxDuration` are still valid route segment config.
- zod is `4.5.2`, so `z.uuid()` is available and `z.string().uuid()` is deprecated.
- There is no generated Supabase type story in the repo; rows will be typed by hand.

## Tasks

### 1. Dependency changes

```bash
bun add @supabase/supabase-js server-only
# after step 6 deletes src/lib/gdrive.ts:
bun remove googleapis
```

`server-only` is a one-line build guard that makes a client-side import of the service-role module fail at build time. Do not add `dexie` or chat-related changes.

### 2. Create the namespaced schema (SQL, applied manually)

New file: `db/sql/0001_chaenix_drive.sql`. Idempotent. Header comment must state: applied once by hand in the shared project's SQL editor; this repo is **not** linked to that project; never run `supabase link` / `supabase db push`.

Pre-flight before running it (shared database):

- `chaenix` must not already exist, or must be exclusively this app's namespace. Check: `select nspname from pg_namespace where nspname = 'chaenix';` and `select tablename from pg_tables where schemaname = 'chaenix';`. If the schema exists with unknown tables, stop and choose another namespace.
- The `drive` bucket name must be free.

```sql
create schema if not exists chaenix;

create table if not exists chaenix.drive_entries (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid references chaenix.drive_entries(id) on delete cascade,
  name         text not null check (btrim(name) <> '' and position('/' in name) = 0),
  is_folder    boolean not null default false,
  storage_path text unique,
  mime_type    text not null default 'application/octet-stream',
  size_bytes   bigint,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- one live name per folder (NULL parent collapses to a sentinel so root is covered)
create unique index if not exists drive_entries_unique_name
  on chaenix.drive_entries (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
  where deleted_at is null;

create index if not exists drive_entries_parent_idx
  on chaenix.drive_entries (parent_id) where deleted_at is null;
create index if not exists drive_entries_trash_idx
  on chaenix.drive_entries (deleted_at desc) where deleted_at is not null;

-- keep updated_at fresh on any update
create or replace function chaenix.drive_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists drive_entries_touch on chaenix.drive_entries;
create trigger drive_entries_touch before update on chaenix.drive_entries
  for each row execute function chaenix.drive_touch();

-- Trash view: trashed rows whose parent chain is live (or root).
create or replace view chaenix.drive_trash with (security_invoker = true) as
select e.*
from chaenix.drive_entries e
where e.deleted_at is not null
  and (
    e.parent_id is null
    or not exists (
      select 1 from chaenix.drive_entries p
      where p.id = e.parent_id and p.deleted_at is not null
    )
  );
```

Functions (same file). All `SECURITY INVOKER`, all in `chaenix`. Use `errcode = 'P0002'` for not-found so the app can map it to 404; default `P0001` for rule violations (mapped to 409):

- `chaenix.drive_soft_delete(p_id uuid) returns integer` — error if the row is missing; then one recursive CTE update setting `deleted_at = now()` for the subtree **where `deleted_at is null`** (this is what makes the timestamp meaningful); return the affected count.
- `chaenix.drive_restore(p_id uuid) returns integer` — capture `v_ts := deleted_at` of `p_id` (error if missing, return `0` if already live); recursive CTE update setting `deleted_at = null` for the subtree **where `deleted_at = v_ts`**. A name conflict surfaces as `23505` and must not be swallowed.
- `chaenix.drive_purge_paths(p_id uuid) returns setof text` — `storage_path` of every non-null row in the subtree. `stable`, `language sql`.
- `chaenix.drive_purge(p_id uuid) returns integer` — error if `p_id` is not trashed (`'Only trashed items can be permanently deleted.'`); error if any descendant is live (`'Cannot permanently delete: the folder still contains live items.'`, defensive — should be unreachable); materialize the subtree id list into a `uuid[]` and `delete from chaenix.drive_entries where id = any(v_ids)` so the recursive read is not evaluated against a concurrently-modifying table; return the row count. Cascade removes descendants.
- `chaenix.drive_move(p_id uuid, p_target uuid) returns void` — error if `p_id` is missing (`P0002`); error if `p_id` is trashed; error if `p_id = p_target`; error if `p_target` is missing or trashed (`P0002`); error if `p_id` appears in the recursive ancestor walk up from `p_target` (own subtree); then `update chaenix.drive_entries set parent_id = p_target where id = p_id` (the trigger refreshes `updated_at`).

Grants (private to the server; do **not** grant `anon`/`authenticated`):

```sql
grant usage on schema chaenix to service_role;
grant all privileges on all tables in schema chaenix to service_role;
grant execute on all functions in schema chaenix to service_role;
alter default privileges in schema chaenix grant all on tables to service_role;
alter default privileges in schema chaenix grant execute on functions to service_role;
```

### 3. Expose the namespace to PostgREST

Hosted project: **Project Settings → API → Exposed schemas** → add `chaenix` (equivalent to adding `chaenix` to `PGRST_DB_SCHEMAS` on self-hosted). Keep `public` exposed.

Service-role probe:

```
GET {SUPABASE_URL}/rest/v1/drive_entries?select=id&limit=1
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
  -H "Accept-Profile: chaenix"
```

Expect `200` with `[]`. `PGRST106` = schema not exposed; `42501`/`PGRST205` = grants or migration missing.

Negative probe (required): repeat with the anon/publishable key and expect a permission failure. If the anon key can read `drive_entries`, stop — the grants or the schema defaults are wrong.

### 4. Create the private bucket

Supabase dashboard → Storage → New bucket → name `drive`, **public = off**. No storage policies are needed because only the server-side service-role client touches it. Check the bucket's **file size limit** and raise it if the proxied upload path needs more than the project default.

Key note: `SUPABASE_SERVICE_ROLE_KEY` accepts either the legacy `service_role` JWT or the newer `sb_secret_…` key; both bypass RLS.

### 5. Env vars and README

- Append to `.env` (gitignored — never commit the key):
  ```
  SUPABASE_URL=https://<project-ref>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service-role-or-secret-key>
  SUPABASE_DB_SCHEMA=chaenix
  SUPABASE_STORAGE_BUCKET=drive
  ```
- `README.md`: delete the `GDRIVE_*` block and the "Google Drive setup (one-time)" section; replace with the Supabase env block and a short one-time setup (run `db/sql/0001_chaenix_drive.sql` by hand, expose the schema, create the private bucket, set env). Correct the v1 notes: uploads are now proxied and bounded by the host body limit (~4.5 MB on Vercel), downloads are streamed, there are no Google-native files.

### 6. Remove the Google Drive implementation

- Delete `src/lib/gdrive.ts`.
- Remove the `googleapis` dependency.
- Confirm no residue: `rg -n "googleapis|gdrive|GDRIVE|Google Drive|googledrive"` over `src`, `README.md`, `package.json` (only this plan and git history may match).

### 7. New server library: `src/lib/supabase.ts`

Starts with `import "server-only";`. Exports:

- `readSupabaseEnv()` — validates the four vars; throws `DriveConfigError` naming what is missing.
- `getSupabaseAdmin()` — memoized singleton `createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, db: { schema } })`.
- `getBucket()` — returns `SUPABASE_STORAGE_BUCKET`.

Do not export a browser client; nothing here may be imported by a client component.

### 8. New server library: `src/lib/drive-store.ts` (replaces `gdrive.ts`)

Keeps the current function names so the routes stay thin:

- `listFolder({ folderId, pageToken, search, orderBy, trashed })` → `{ items: DriveEntry[], nextPageToken: string | null }`
- `createFolder(name, parentId)`
- `renameEntry(id, name)`
- `moveEntries(ids, targetFolderId)` → `BulkResult`
- `deleteEntries(ids)` → soft delete → `BulkResult`
- `restoreEntries(ids)` → `BulkResult`
- `purgeEntries(ids)` → `BulkResult`
- `uploadFile({ id, name, mimeType, parentId, body })` → `DriveEntry`
- `downloadFile(id)` → `{ entry, stream, contentLength? }`
- `driveErrorResponse(error)`

Types: `DriveEntry = { id, name, mimeType, size?, modifiedTime, isFolder, deletedAt? }`, where `modifiedTime` = `updated_at` and `size` = `String(size_bytes)`, preserving the wire contract `formatSize` already consumes. `BulkResult = { moved: string[]; deleted: string[]; restored: string[]; purged: string[]; failed: { id: string; name?: string; error: string }[] }` — one shape for all four bulk actions, so the routes stay uniform and the UI can report partial failures. Rows come back untyped from PostgREST, so declare a local `DriveRow` interface and cast through `unknown` rather than introducing codegen.

Implementation notes:

- **Listing (files view)**: `from("drive_entries").select("*")`, `.is("parent_id", null)` or `.eq("parent_id", folderId)`, `.is("deleted_at", null)`, optional `.ilike("name", `%${escaped}%`)` with `%`, `_`, `\` escaped, `.order("is_folder", { ascending: false })` then the sort column, `.range(offset, offset + 49)`.
- **Listing (trash view)**: `from("drive_trash").select("*")` (the view already restricts to roots), optional name search, `.order("deleted_at", { ascending: false })`, `.range(...)`. `folderId` is ignored.
- **Cursor**: `Buffer.from(String(offset), "utf8").toString("base64url")` / reverse; malformed cursors restart at offset 0.
- **Upload order** (deliberate): (1) validate headers and that the parent exists and is live; (2) cheap live-name pre-check in the parent → 409 before spending bytes; (3) `id = crypto.randomUUID()`, `path = objects/${id}`; (4) `await req.arrayBuffer()`, reject empty (`DriveInputError`); (5) `storage.upload(path, buffer, { contentType, upsert: false, metadata: { name, parentId } })` → storage failure is `DriveUpstreamError`; (6) insert the row with `storage_path`, `mime_type`, `size_bytes`. On `23505` from the insert, `storage.remove([path])` and return the 409; on any other insert failure, remove the object and surface the error. Chosen over upload-first so a name conflict never uploads megabytes, and over insert-first so a crash cannot leave a row pointing at a nonexistent object.
- **Download**: load the row → 404 if missing, 409 `"This item is in the Trash."` if trashed, 400 if a folder; `storage.createSignedUrl(path, 60)`; `fetch(signedUrl)` server-side; return `new Response(res.body, { headers })` so bytes stream without buffering. Headers: `Content-Type` from `mime_type`, `Content-Disposition: attachment; filename*=UTF-8''…`, `Cache-Control: no-store`, `Content-Length` from `size_bytes` when present.
- **Guards**: `renameEntry`, `moveEntries`, and `createFolder` must reject trashed rows/parents (`DriveConflictError`), matching the DB functions rather than relying on them alone.
- **Purge order per id**: `drive_purge_paths` → `storage.remove(paths)` → `drive_purge`. If the storage removal fails, abort that id and leave its rows intact (a leftover object is preferable to a row pointing at missing bytes).
- **Bulk execution**: cap at 100 ids; run with bounded concurrency (≈5) so 100 ids do not serialize into 100 round trips; collect per-id results.
- **Errors**: `DriveError` (with `status`) + `DriveConfigError` 500, `DriveInputError` 400, `DriveNotFoundError` 404, `DriveConflictError` 409, `DriveUpstreamError` 502. Map: `PGRST106`/`PGRST205`/`42P01` → config error naming the schema/table and pointing at steps 2–3; `23505` → conflict `"An item with that name already exists here."`; `23514` → input error from the name CHECK; `P0002` → 404; `P0001` → 409 using the RAISE message; storage failures → 502. Log with a `[drive]` prefix.

### 9. `src/lib/drive-api.ts`

Keep `isAdminSession`, `unauthorizedResponse`, `parseJsonBody`, `ParsedBody` unchanged. Replace `DRIVE_ID_SCHEMA` with `export const DRIVE_ID_SCHEMA = z.uuid();`.

### 10. Update the API routes

| Route | Change |
|---|---|
| `GET /api/drive/files` | Pass `trashed` through from `?trashed=true` (selects the `drive_trash` view). Same JSON shape. |
| `POST /api/drive/folders` | Bind to `createFolder`; unchanged request/response. |
| `POST /api/drive/upload` | Keep `x-file-name` / `x-parent-id` / `content-type`; generate the id in the route; read `await req.arrayBuffer()`; call `uploadFile`. |
| `PATCH /api/drive/files/[id]` | Bind to `renameEntry`. |
| `DELETE /api/drive/files/[id]` | Bind to `deleteEntries([id])` (soft delete). |
| `GET /api/drive/files/[id]/download` | Bind to `downloadFile`; stream the signed-URL body. Keep `maxDuration = 60`. |
| `POST /api/drive/bulk` | `action` enum becomes `move \| delete \| restore \| purge`; `ids` max 100. Response is fixed as `{ ok, moved: string[], deleted: string[], restored: string[], purged: string[], failed: { id, name?, error }[] }` with `ok = failed.length === 0`. `DeleteEntry`'s existing consumers (`drive-ui.tsx` reads `failed`; `MoveModal` reads `moved`) keep working. |

All routes keep `export const runtime = "nodejs"` and the existing `isAdminSession` / `getServerSession` auth.

### 11. Update `src/app/admin/drive/drive-ui.tsx`

- Delete `isGoogleNative` and the "Google file" badge; every listed file becomes downloadable — drop the `aria-disabled` / `pointer-events-none` branch.
- Extend `DriveEntry` with `deletedAt?: string`.
- Add `const [view, setView] = useState<"files" | "trash">("files")` with a Files/Trash toggle in the toolbar; include `view` in `viewKey` and send `trashed=true` in `refresh` / `handleLoadMore`.
- Trash view: hide New folder, Upload, the breadcrumb, and the sort selector; list the trash roots flat; per-row actions are **Restore** and **Delete forever** only (no rename, move, download, or soft delete); show `deletedAt` in the Modified column.
- Files view: unchanged behavior; bulk actions stay Move / Delete.
- Confirm copy: soft delete → `Move "<name>" to Trash? You can restore it later.`; purge → `Permanently delete "<name>"? This cannot be undone.` For a folder, add `and everything inside it`.
- Surface partial bulk failures from `data.failed` (already partly present for delete) for restore and purge too.
- `reportError` copy must stop saying "Drive"/"Google"; use "Storage".
- Header label "Drive Files" → "Storage"; keep the card, toolbar, table, uploads panel, drag-and-drop, and `MoveModal` structure otherwise intact.

### 12. Update `src/app/admin/admin-shell.tsx`

Change the nav item label `"Drive"` → `"Storage"`; keep `href: "/admin/drive"` and the icon.

## Validation

1. `npx tsc --noEmit` and `bun run lint` clean.
2. `rg -n "googleapis|gdrive|GDRIVE" src README.md package.json` returns nothing.
3. Namespace probes from step 3 both behave (service role 200, anon denied, `drive_trash` queryable with the service role).
4. Manual smoke test signed in as admin at `/admin/drive`:
   - create a folder, a nested folder, and a duplicate name at root (expect a 409 message, not a crash);
   - upload a single file, a multi-select batch, a drag-and-drop, and one above ~5 MB (expect a clear failure if the host body limit is hit);
   - rename a file and a folder; move a file and a folder via the modal; attempt to move a folder into its own subfolder (expect a readable rejection); attempt the same name in the same folder after a move (expect 409);
   - search within a folder; exercise all three sort modes; "Load more" past 50 rows;
   - download a file; confirm content-type and filename;
   - delete a file `b.txt`, then delete its parent folder → Trash shows **one** row for the folder, not two; Restore the folder → the folder returns **without** `b.txt`, and `b.txt` is then visible in Trash as its own root; Restore `b.txt`;
   - create `a.txt`, delete it, create `a.txt` again (expect success), then try Restore on the trashed `a.txt` (expect a 409 naming the conflict);
   - Delete forever on a folder containing trashed children → confirm the row and every `objects/*` object for that subtree are gone from the bucket.
5. DB spot-checks in the SQL editor: rows land in `chaenix.drive_entries` (never `public`); no rows remain for purged subtrees; no `objects/*` orphans.
6. Confirm no Supabase key can reach the browser: `rg -n "NEXT_PUBLIC_.*SUPABASE" .` returns nothing, and no client component imports `src/lib/supabase.ts`.

## Risks and mitigations

- **`PGRST106` invalid schema** — namespace not exposed or granted. Mitigated by the step 3 probe before wiring the UI.
- **Proxied upload body limit** (~4.5 MB on Vercel; unrestricted on a self-hosted Node server) plus the bucket's own file-size limit. Documented; moving to signed upload URLs is explicitly deferred.
- **Offset pagination drift** while rows are inserted during paging. Accepted for an admin tool.
- **Object/row divergence** — mitigated by pre-check → upload → insert with compensating `storage.remove`, and by purge removing objects before rows.
- **Restore resurrecting old deletes** — prevented by timestamp-scoped restore; covered by the explicit smoke test.
- **Restore blocked by name conflict** — no auto-rename by design; the 409 names the conflicting live item, and the user renames the live item before retrying.
- **Shared-database blast radius** — DDL is additive and scoped to `chaenix`; the SQL file lives outside `supabase/` so the CLI cannot pick it up; a pre-flight checks the schema name is ours before it runs.
- **Service-role key leakage** — `.env` is gitignored, `src/lib/supabase.ts` imports `server-only`, and no `NEXT_PUBLIC_` Supabase var is introduced.
- **Recursive RPC cost** on very deep trees — acceptable at admin-tool scale; `parent_id` indexes cover the walks.

## Out of scope

- Migrating existing Google Drive content (starts empty).
- Migrating chats/Dexie (`src/lib/chat-client-store.ts`) to Supabase.
- Trash retention policies or automatic purging.
- Renaming items while they sit in the Trash (the conflict remedy is to rename the live item).
- Moving an item to the root of the drive (the modal only offers folders, as today).
- Per-user ownership, RLS policies, or multi-tenant access (single admin session, service role only).
- Signed direct browser uploads; resumable/TUS uploads for large files.
- Storing drive metadata in object `user_metadata` (rejected in favor of the table).
- Supabase CLI migration management and generated database types.
