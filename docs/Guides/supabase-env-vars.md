# Getting the Supabase env vars from the dashboard

This guide walks through collecting the four `SUPABASE_*` values the Storage
feature (`/admin/drive`) needs, and putting them in this repo's `.env`.

Two of the four are **copied from the Supabase dashboard** and two are **chosen
by this app** (they must match things you create in the dashboard).

| Variable | Where it comes from | Value for this app |
|---|---|---|
| `SUPABASE_URL` | Dashboard → Project Settings → Data API → **Project URL** | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Project Settings → API Keys → **secret / service_role** key | `sb_secret_…` or the legacy `eyJ…` service_role JWT |
| `SUPABASE_DB_SCHEMA` | Chosen by this app | `chaenix` |
| `SUPABASE_STORAGE_BUCKET` | Chosen by this app | `drive` |

If `SUPABASE_DB_SCHEMA` or `SUPABASE_STORAGE_BUCKET` are omitted, the code
defaults to `chaenix` and `drive`, so they are only needed if you picked
different names.

---

## 1. Open the right project

1. Go to the Supabase dashboard and sign in.
2. Open the project that hosts the `chaenix` schema and the `drive` bucket.
3. The **project ref** is the short id in the dashboard URL
   (`https://supabase.com/dashboard/project/<project-ref>`) and in the project
   name dropdown. It is the same string used in `SUPABASE_URL`.

> The database is shared. Make sure you are in the project where you (or an
> admin) already ran `db/sql/0001_chaenix_drive.sql`. Nothing in this repo is
> linked to the project, so the dashboard is the only source of truth.

## 2. Copy `SUPABASE_URL`

1. Open **Project Settings** (gear icon, bottom of the left sidebar).
2. Open **Data API** (older dashboards call this section **API**).
3. Copy **Project URL**. It looks like `https://abcdefghijklmnop.supabase.co`.

Use the bare project URL:

- Do **not** append `/rest/v1` — the Supabase client adds the REST path itself.
- Do **not** use the connection string / pooler host (anything containing
  `pooler`, `db.` or a port like `:5432`); that is for direct Postgres clients.

## 3. Copy `SUPABASE_SERVICE_ROLE_KEY`

1. Stay in **Project Settings**.
2. Open **API Keys** (older dashboards: **API → Project API keys**).
3. Reveal and copy the **server-side secret** key.

There are two key generations and either works:

- **Legacy JWT keys** — the long `eyJ…` tokens listed as `anon` and
  `service_role`. Copy the **`service_role`** one, not `anon`.
- **New API keys** — `sb_publishable_…` (browser-safe) and `sb_secret_…`
  (server-only). Copy the **secret** key.

Rules that matter here:

- **Never** use the `anon` / publishable key. It is denied access to the
  `chaenix` schema by design, so uploads/listings would fail.
- The service-role/secret key **bypasses Row Level Security**. Treat it like a
  root password: server-side only, never in a `NEXT_PUBLIC_*` variable, never in
  client code, never committed.

## 4. Set the schema and bucket names

These are not values you read off a dashboard screen — they are names this app
uses and they must match what exists in the project:

- `SUPABASE_DB_SCHEMA=chaenix` — the schema must also be listed under
  **Project Settings → API → Exposed schemas** (see the companion guide).
- `SUPABASE_STORAGE_BUCKET=drive` — the Storage bucket must exist and be
  **private** (public = off).

## 5. Put the values in `.env`

Open `.env` in the repo root and add (or uncomment) the block:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-or-sb_secret-key>
SUPABASE_DB_SCHEMA=chaenix
SUPABASE_STORAGE_BUCKET=drive
```

Notes:

- `.env` is gitignored (`.env*`), so the key cannot be committed by accident.
  Keep it that way — do not paste the key into `README.md`, a guide, or a commit.
- Quote the value only if it contains characters your shell/ENV parser needs;
  the keys above have none.
- **Restart the dev server** after editing `.env`. Environment variables are read
  at process start, and the Supabase client is memoized on first use.
- If the values are missing or empty, the app fails with:
  `Storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.`

## 6. Verify

From the repo root, run the service-role probe. Expect **HTTP 200** and a body
of `[]` (the table is empty):

```bash
curl -sS -i "$SUPABASE_URL/rest/v1/drive_entries?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Accept-Profile: chaenix"
```

On Windows PowerShell, `curl` is an alias for `Invoke-WebRequest`, so call
`curl.exe` explicitly:

```powershell
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<key>"

curl.exe -sS -i "$env:SUPABASE_URL/rest/v1/drive_entries?select=id&limit=1" `
  -H "apikey: $env:SUPABASE_SERVICE_ROLE_KEY" `
  -H "Authorization: Bearer $env:SUPABASE_SERVICE_ROLE_KEY" `
  -H "Accept-Profile: chaenix"
```

Also run the **negative probe**: repeat the same request with the `anon` /
publishable key. It must be rejected (permission error / 401). If the anon key
can read `drive_entries`, stop — the grants or the schema exposure are wrong.

Finally, start the app and open `/admin/drive` signed in as admin. Creating a
folder is the quickest end-to-end check.

## 7. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.` | One or both vars missing, empty, or the server was not restarted after editing `.env`. |
| `Storage is not configured correctly: the "chaenix" schema, "drive_entries" table, or drive functions are not available to PostgREST.` | `chaenix` is not in **Exposed schemas**, or `db/sql/0001_chaenix_drive.sql` has not been applied. |
| `401 Unauthorized` from `/api/drive/*` | You are not signed in to the admin app. This is auth, not Supabase config. |
| `502` mentioning `Bucket not found` | `SUPABASE_STORAGE_BUCKET` does not match an existing bucket, or the bucket is missing. |
| `502` mentioning `Invalid API key` / JWT errors | Wrong key copied (e.g. `anon`), the key was rotated, or the value has stray whitespace/quotes. |
| Anon/publishable key can read data | Grants are wrong. The `chaenix` schema should only grant to `service_role`. |

Rotating a leaked key: delete it in **Project Settings → API Keys** and paste
the replacement into `.env`, then restart the server.

---

Companion: [Supabase dashboard setup for the Storage feature](./supabase-dashboard-setup.md)
covers applying the SQL, exposing the schema, and creating the bucket.
