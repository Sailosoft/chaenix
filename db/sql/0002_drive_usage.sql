-- 0002_drive_usage.sql
--
-- Total storage usage for /admin/drive, stored in the `chaenix` schema of the
-- SHARED Supabase database.
--
-- APPLY THIS FILE BY HAND, once, in the shared project's SQL editor.
-- This repository is NOT linked to that project: never run `supabase link`
-- and never run `supabase db push`.
--
-- This file is idempotent and additive: it only touches `chaenix`.
-- Depends on db/sql/0001_chaenix_drive.sql having been applied first.
--
-- Usage counts every stored file, including rows in the Trash (deleted_at is
-- not null), mirroring how Google Drive counts trashed items against quota.
-- Only permanently purged rows stop counting. Folders have no bytes.

create or replace function chaenix.drive_usage()
returns bigint
language sql
stable
security invoker
set search_path = chaenix
as $$
  select coalesce(sum(size_bytes), 0)::bigint
  from chaenix.drive_entries
  where is_folder = false and size_bytes is not null;
$$;

-- Private to the server: never grant anon/authenticated on chaenix.
grant execute on function chaenix.drive_usage() to service_role;
