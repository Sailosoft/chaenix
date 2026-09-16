# Supabase dashboard setup for the Storage feature

One-time dashboard work needed before `/admin/drive` can use Supabase Storage.
Do this **before** collecting the env vars; see
[supabase-env-vars.md](./supabase-env-vars.md) for that part.

The database is **shared** with other apps. Everything below is additive and
scoped to the `chaenix` schema and the `drive` bucket. This repo is **not**
linked to the Supabase project — never run `supabase link` or
`supabase db push`, and never move `db/sql/0001_chaenix_drive.sql` under a
`supabase/` directory.

---

## 1. Pre-flight: check the names are free

Open the dashboard, go to **SQL Editor → New query**, and run each of these
before making any changes:

```sql
-- Must return zero rows. If 'chaenix' already exists, inspect it first.
select nspname from pg_namespace where nspname = 'chaenix';

-- Must return zero rows (or only tables you know belong to this app).
select tablename from pg_tables where schemaname = 'chaenix';

-- Must return zero rows: the bucket id must be free.
select id, name, public from storage.buckets where id = 'drive';
```

If `chaenix` exists with tables this app does not own, **stop** and pick a
different namespace (`SUPABASE_DB_SCHEMA` can be set to it in `.env`). Do not
drop or overwrite someone else's objects.

## 2. Apply the migration

1. **SQL Editor → New query**.
2. Paste the full contents of `db/sql/0001_chaenix_drive.sql` from this repo.
3. Run it once. It is idempotent (`if not exists` / `create or replace`), so
   re-running is safe.

It creates:

- the `chaenix` schema, `chaenix.drive_entries` and the `chaenix.drive_trash` view;
- the drive functions (`drive_soft_delete`, `drive_restore`, `drive_purge_paths`,
  `drive_purge`, `drive_move`, `drive_touch`);
- grants for `service_role` only.

Verify:

```sql
select table_name
from information_schema.tables
where table_schema = 'chaenix';

select routine_name
from information_schema.routines
where routine_schema = 'chaenix';
```

You should see `drive_entries` and `drive_trash`, and the six functions above.

## 3. Expose the schema to PostgREST

The app talks to the database through PostgREST, which only serves schemas on an
allow-list.

1. **Project Settings → API**.
2. Under **Exposed schemas**, add `chaenix`.
3. Keep `public` exposed (other parts of the project may rely on it).

This is the equivalent of adding `chaenix` to `PGRST_DB_SCHEMAS` on a
self-hosted instance. No dashboard restart is needed; the API picks it up.

## 4. Create the private bucket

1. Open **Storage** in the left sidebar.
2. **New bucket** → name it `drive` (must match `SUPABASE_STORAGE_BUCKET`).
3. Leave **Public bucket = off**. Only the server-side service-role client
   touches it, so no Storage policies are required.
4. Open the bucket's configuration and check its **file size limit**. The app
   proxies uploads through the route handler, so an upload can also fail on the
   host's body limit (~4.5 MB on Vercel). Raise the bucket limit if you intend
   to allow larger files on a self-hosted Node server.

## 5. Set the environment variables

Follow [supabase-env-vars.md](./supabase-env-vars.md). The short version:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-or-sb_secret-key>
SUPABASE_DB_SCHEMA=chaenix
SUPABASE_STORAGE_BUCKET=drive
```

Restart the dev/prod server after editing `.env`.

## 6. Verify

Service-role probe — expect **HTTP 200** with `[]`:

```bash
curl -sS -i "$SUPABASE_URL/rest/v1/drive_entries?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Accept-Profile: chaenix"
```

The same request with the `anon` / publishable key **must be rejected**. If the
anon key can read the table, the grants or the exposure are wrong — fix that
before using the feature.

Then sign in as admin and open `/admin/drive`. A quick end-to-end check:

1. Create a folder, then a nested folder.
2. Upload a small file and download it; check the filename and content type.
3. Delete the file, open **Trash**, and restore it.
4. Create `a.txt`, delete it, create `a.txt` again, then try to restore the
   trashed copy — expect a conflict message naming the issue.
5. **Delete forever** a folder that contains trashed children, then confirm in
   **Storage → drive → objects/** that every object for that subtree is gone.

## 7. Database spot-checks

Run these in the SQL Editor to confirm data lands in the right place:

```sql
-- Rows must be under chaenix, never public.
select schemaname, tablename from pg_tables
where schemaname in ('chaenix', 'public') and tablename like 'drive%';

-- No rows should remain for a purged subtree.
select count(*) from chaenix.drive_entries;

-- Trash roots, newest first.
select id, name, is_folder, deleted_at
from chaenix.drive_trash
order by deleted_at desc
limit 20;
```

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `PGRST106` — schema not in the allow-list | Re-check step 3 (**Exposed schemas**). |
| `PGRST205` / `42P01` — table not found | Re-run the migration (step 2). |
| `PGRST202` — function not found | The function grants or the migration are missing; re-run step 2. |
| Anon key can read `drive_entries` | Grants are too broad. Only `service_role` should have access to `chaenix`. |
| `Bucket not found` | Bucket name mismatch, or the bucket was not created (step 4). |
| Uploads fail around a few MB | Host body limit and/or the bucket file size limit (step 4). |

## Related

- [Getting the Supabase env vars from the dashboard](./supabase-env-vars.md)
- `README.md` — project overview and the short setup checklist
- `db/sql/0001_chaenix_drive.sql` — the migration applied in step 2
