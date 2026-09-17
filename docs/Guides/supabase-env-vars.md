# Getting the Supabase env vars from the dashboard

This guide walks through collecting the four `SUPABASE_*` values the Storage
feature (`/admin/drive`) needs, and putting them in this repo's `.env`.

It uses the **new-format secret key** (`sb_secret_…`). The legacy `service_role`
JWT is deprecated (Supabase turns the legacy keys off at the end of 2026) and is
not used by this app. For the full migration background, see
[Migrating to publishable and secret API keys][migration].

Two of the four values are **copied from the Supabase dashboard** and two are
**chosen by this app** (they must match things you create in the dashboard).

| Variable | Where it comes from | Value for this app |
|---|---|---|
| `SUPABASE_URL` | **Connect** dialog, or **Project Settings → Data API → Project URL** | `https://<project-ref>.supabase.co` |
| `SUPABASE_SECRET_KEY` | **Settings → API Keys → Publishable and secret API keys → secret key** | `sb_secret_…` |
| `SUPABASE_DB_SCHEMA` | Chosen by this app | `chaenix` |
| `SUPABASE_STORAGE_BUCKET` | Chosen by this app | `drive` |

If `SUPABASE_DB_SCHEMA` or `SUPABASE_STORAGE_BUCKET` are omitted, the code
defaults to `chaenix` and `drive`, so they are only needed if you picked
different names.

Which key does this app use? It runs entirely on the server, so it needs the
**secret key** only. No publishable key is used, and nothing Supabase-related
reaches the browser.

[migration]: https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys

---

## 1. Open the right project

1. Sign in to the Supabase dashboard.
2. Open the project that hosts the `chaenix` schema and the `drive` bucket.
3. The **project ref** is the short id in the dashboard URL
   (`https://supabase.com/dashboard/project/<project-ref>`) and in the project
   name dropdown. It is the same string used in `SUPABASE_URL`.

> The database is shared. Make sure you are in the project where you (or an
> admin) already ran `db/sql/0001_chaenix_drive.sql`. Nothing in this repo is
> linked to the project, so the dashboard is the only source of truth.

## 2. Copy `SUPABASE_URL`

1. Open the project's **Connect** dialog, which shows the API URL pre-filled for
   a chosen framework, or
2. Open **Project Settings → Data API** and copy **Project URL**.

Either way it looks like `https://abcdefghijklmnop.supabase.co`. Use the bare
project URL:

- Do **not** append `/rest/v1` — the Supabase client adds the REST path itself.
- Do **not** use the connection string / pooler host (anything containing
  `pooler`, `db.` or a port like `:5432`); that is for direct Postgres clients.

## 3. Create or copy the secret key

1. Open **Settings → API Keys**.
2. Select the **Publishable and secret API keys** tab.
3. If the project only has legacy keys, click **Create new API keys**. This is
   safe: it adds a publishable key and a secret key **alongside** the existing
   `anon` and `service_role` keys, which keep working until you deactivate them.
4. Reveal and copy the **secret key** — it starts with `sb_secret_`.

For longer, click-by-click generation directions (including the CLI and
Management API alternatives), see
[Generate the secret API key](./supabase-dashboard-setup.md#5-generate-the-secret-api-key)
in the companion guide.

Notes:

- The new keys are created under the name `default`. You can create extra secret
  keys with their own names (for example one per backend component) so you can
  rotate them independently. Any of them works here — the app stores only the
  key value, not its name.
- **Never** use the publishable key (`sb_publishable_…`) or the legacy `anon`
  key: this app's secret key maps to the `service_role` Postgres role, and the
  `chaenix` schema grants nothing to `anon`/`authenticated`, so the app would
  fail with permission errors.
- **Never** use the legacy `service_role` JWT either. It still works today, but
  it is deprecated, is a long-lived JWT, and cannot be rotated per service.

Why secret keys are better than the legacy `service_role` JWT:

- They are short strings, not JWTs, so they no longer depend on the project's
  shared JWT secret.
- They are rejected with HTTP 401 if they are ever used from a browser (Supabase
  matches on the `User-Agent` header).
- You can keep one per backend component, so a leak forces one rotation only.

A secret key still **bypasses Row Level Security** and has full access to the
data. Treat it like a root password: server-side only, never in a
`NEXT_PUBLIC_*` variable, never in client code, never committed.

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
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_DB_SCHEMA=chaenix
SUPABASE_STORAGE_BUCKET=drive
```

Notes:

- `.env` is gitignored (`.env*`), so the key cannot be committed by accident.
  Keep it that way — do not paste the key into `README.md`, a guide, or a commit.
- **Restart the dev server** after editing `.env`. Environment variables are read
  at process start, and the Supabase client is memoized on first use.
- If the values are missing or empty, the app fails with:
  `Storage is not configured. Set SUPABASE_URL, SUPABASE_SECRET_KEY.`

## 6. Verify

From the repo root, run the secret-key probe. Expect **HTTP 200** and a body of
`[]` (the table is empty):

```bash
curl -sS -i "$SUPABASE_URL/rest/v1/drive_entries?select=id&limit=1" \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Accept-Profile: chaenix"
```

Send publishable and secret keys on the **`apikey` header only**. They are not
JWTs, so anything that tries to verify one as a JWT fails — in particular, do
not put a secret key on `Authorization: Bearer` in hand-written HTTP (curl,
webhooks, `pg_net`). The `supabase-js` client used by the app handles this for
its own requests.

Under the hood, the secret key assumes the built-in `service_role` Postgres
role, which is why the migration grants access to `service_role` and why the
variable is not named after the legacy key.

On Windows PowerShell, `curl` is an alias for `Invoke-WebRequest`, so call
`curl.exe` explicitly:

```powershell
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_SECRET_KEY = "sb_secret_..."

curl.exe -sS -i "$env:SUPABASE_URL/rest/v1/drive_entries?select=id&limit=1" `
  -H "apikey: $env:SUPABASE_SECRET_KEY" `
  -H "Accept-Profile: chaenix"
```

Also run the **negative probe**: repeat the same request with the publishable
key. It must be rejected (permission error). If the publishable key can read
`drive_entries`, stop — the grants or the schema exposure are wrong.

Finally, start the app and open `/admin/drive` signed in as admin. Creating a
folder is the quickest end-to-end check.

## 7. Retire the legacy keys (once nothing uses them)

Only do this after the app works with the secret key:

1. Confirm no other component (other apps in the shared project, CI, cron jobs,
   webhooks) still uses the `anon` or `service_role` key.
2. Open **Settings → API Keys** and deactivate the legacy keys. Deactivation is
   reversible if you find a caller you missed.

Legacy keys belong to the project, not to a single app. If another app in the
shared project still uses the legacy `anon`/`service_role` keys, it has to be
migrated before you deactivate them.

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Storage is not configured. Set SUPABASE_URL, SUPABASE_SECRET_KEY.` | One or both vars missing, empty, or the server was not restarted after editing `.env`. |
| `Storage is not configured correctly: the "chaenix" schema, "drive_entries" table, or drive functions are not available to PostgREST.` | `chaenix` is not in **Exposed schemas**, or `db/sql/0001_chaenix_drive.sql` has not been applied. |
| `Invalid JWT` | The secret key was put on an `Authorization: Bearer` header in hand-written HTTP. Send it on `apikey` only. |
| `401 Unauthorized` in a browser / from the client | A secret key was used from a browser; Supabase blocks that by design. This app must keep it server-side only. |
| `401 Unauthorized` from `/api/drive/*` | You are not signed in to the admin app. This is auth, not Supabase config. |
| Permission error mentioning `anon` | The publishable/`anon` key was used instead of the secret key. |
| `502` mentioning `Bucket not found` | `SUPABASE_STORAGE_BUCKET` does not match an existing bucket, or the bucket is missing. |
| `502` mentioning `Invalid API key` | Wrong or deleted key, or the value has stray whitespace/quotes. |

Rotating a leaked key: create a new secret key in **Settings → API Keys**,
replace it in `.env`, restart, verify, then delete the old key (deleting a secret
key cannot be undone). See the [Supabase key-rotation guide][rotation].

[rotation]: https://supabase.com/docs/guides/getting-started/api-keys#leaked-key

---

Companion: [Supabase dashboard setup for the Storage feature](./supabase-dashboard-setup.md)
covers applying the SQL, exposing the schema, and creating the bucket.
