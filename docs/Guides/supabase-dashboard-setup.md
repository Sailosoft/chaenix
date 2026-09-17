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

The migration grants the schema to the built-in `service_role` Postgres role.
New-format secret keys (`sb_secret_…`) assume that same role, so the grants do
not change when you migrate off the legacy `service_role` JWT.

## 4. Create the private bucket

1. Open **Storage** in the left sidebar.
2. **New bucket** → name it `drive` (must match `SUPABASE_STORAGE_BUCKET`).
3. Leave **Public bucket = off**. Only the server-side secret-key client
   touches it, so no Storage policies are required.
4. Open the bucket's configuration and check its **file size limit**. The app
   proxies uploads through the route handler, so an upload can also fail on the
   host's body limit (~4.5 MB on Vercel). Raise the bucket limit if you intend
   to allow larger files on a self-hosted Node server.

## 5. Generate the secret API key

The app authenticates to Supabase with a **secret key** (`sb_secret_…`). Generate
one before writing `.env`.

### Dashboard (recommended)

1. Open **Settings → API Keys**.
2. Select the **Publishable and secret API keys** tab.
3. If the tab shows a **Create new API keys** button, the project is still on
   legacy keys only. Click it. This is safe: it adds a publishable key and a
   secret key **alongside** the existing `anon` and `service_role` keys, which
   keep working until you deactivate them. If the keys already exist, use them.
4. Reveal and copy the **secret key**. It starts with `sb_secret_`.
5. Optional: create an additional secret key from the same tab and give it a
   name, for example `chaenix-drive`. Keeping one key per backend component
   means a leak forces only that one rotation. The app stores only the value, so
   any key name works.

The **publishable key** (`sb_publishable_…`) is listed on the same tab. This app
does not use it: it runs entirely on the server and needs the secret key. Do not
use the legacy `anon`/`service_role` keys either — they are deprecated (Supabase
turns them off at the end of 2026).

Record which key name the value came from. There is no need to write the key
itself anywhere except `.env`.

### CLI alternative (read keys)

Read the project's keys from a terminal instead of the dashboard:

```bash
supabase login
supabase projects list
supabase projects api-keys --project-ref <project-ref>
```

### Management API alternative (read keys)

For scripted provisioning, read keys with a personal access token (requires the
`secrets:read` scope, or the `api_gateway_keys_read` permission on a fine-grained
token):

```bash
export PROJECT_REF="<project-ref>"
export SUPABASE_ACCESS_TOKEN="<personal-access-token>"

curl -sS -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/api-keys?reveal=true" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

`reveal=true` puts the key values in the response, so write them straight into
your secret store rather than printing them, or they will land in your CI logs.

Then follow [supabase-env-vars.md](./supabase-env-vars.md) to place the value in
`.env`.

## 6. Set the environment variables

The four values, with the secret key from step 5:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_DB_SCHEMA=chaenix
SUPABASE_STORAGE_BUCKET=drive
```

`SUPABASE_URL` comes from the **Connect** dialog or **Project Settings → Data
API → Project URL**; `SUPABASE_DB_SCHEMA` and `SUPABASE_STORAGE_BUCKET` are the
app-chosen names and must match what you created above. Restart the dev/prod
server after editing `.env`.

## 7. Verify

Secret-key probe — expect **HTTP 200** with `[]`. Send the key on the `apikey`
header only; it is not a JWT:

```bash
curl -sS -i "$SUPABASE_URL/rest/v1/drive_entries?select=id&limit=1" \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Accept-Profile: chaenix"
```

The same request with the publishable key (`sb_publishable_…`) or the legacy
`anon` key **must be rejected**. If a public key can read the table, the grants
or the exposure are wrong — fix that before using the feature.

Then sign in as admin and open `/admin/drive`. A quick end-to-end check:

1. Create a folder, then a nested folder.
2. Upload a small file and download it; check the filename and content type.
3. Delete the file, open **Trash**, and restore it.
4. Create `a.txt`, delete it, create `a.txt` again, then try to restore the
   trashed copy — expect a conflict message naming the issue.
5. **Delete forever** a folder that contains trashed children, then confirm in
   **Storage → drive → objects/** that every object for that subtree is gone.

## 8. Database spot-checks

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

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `PGRST106` — schema not in the allow-list | Re-check step 3 (**Exposed schemas**). |
| `PGRST205` / `42P01` — table not found | Re-run the migration (step 2). |
| `PGRST202` — function not found | The function grants or the migration are missing; re-run step 2. |
| `Invalid JWT` | The secret key was sent on `Authorization: Bearer` in hand-written HTTP. Send it on `apikey` only. |
| Public key can read `drive_entries` | Grants are too broad. Only `service_role` (the role a secret key assumes) should have access to `chaenix`. |
| Permission error mentioning `anon` | The publishable/`anon` key was used instead of the `sb_secret_…` key. |
| `Bucket not found` | Bucket name mismatch, or the bucket was not created (step 4). |
| Uploads fail around a few MB | Host body limit and/or the bucket file size limit (step 4). |

## Related

- [Getting the Supabase env vars from the dashboard](./supabase-env-vars.md)
- `README.md` — project overview and the short setup checklist
- `db/sql/0001_chaenix_drive.sql` — the migration applied in step 2
