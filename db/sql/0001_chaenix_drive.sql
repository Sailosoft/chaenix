-- 0001_chaenix_drive.sql
--
-- Drive metadata for /admin/drive, stored in the `chaenix` schema of a SHARED
-- Supabase database. File bytes live in the private `drive` Storage bucket.
--
-- APPLY THIS FILE BY HAND, once, in the shared project's SQL editor.
-- This repository is NOT linked to that project: never run `supabase link`
-- and never run `supabase db push`.
--
-- Pre-flight (the database is shared -- verify before running):
--   select nspname from pg_namespace where nspname = 'chaenix';
--   select tablename from pg_tables where schemaname = 'chaenix';
--   -- the `drive` Storage bucket name must also be free
-- If the schema already exists with tables this app does not own, stop and
-- choose another namespace.
--
-- This file is idempotent and additive: it only touches `chaenix`.

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

-- Trash view: trashed rows whose parent chain is live (or root), i.e. trash roots.
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

-- Soft delete a subtree. One now() is applied to every row stamped by this
-- delete, which is what makes deleted_at identify "which delete" trashed a row.
-- Rows that are already trashed keep their older timestamp.
create or replace function chaenix.drive_soft_delete(p_id uuid)
returns integer
language plpgsql
security invoker
set search_path = chaenix
as $$
declare
  v_ts timestamptz := now();
  v_count integer;
begin
  if not exists (select 1 from chaenix.drive_entries where id = p_id) then
    raise exception 'Item not found.' using errcode = 'P0002';
  end if;

  with recursive subtree as (
    select id from chaenix.drive_entries where id = p_id
    union all
    select c.id
    from chaenix.drive_entries c
    join subtree s on c.parent_id = s.id
  )
  update chaenix.drive_entries e
  set deleted_at = v_ts
  where e.id in (select id from subtree)
    and e.deleted_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Restore a subtree, but only rows stamped by the same delete. Independently
-- trashed descendants keep their older timestamp and stay in the Trash.
-- A live-name conflict surfaces as 23505 from the partial unique index.
create or replace function chaenix.drive_restore(p_id uuid)
returns integer
language plpgsql
security invoker
set search_path = chaenix
as $$
declare
  v_ts timestamptz;
  v_count integer;
begin
  select deleted_at into v_ts from chaenix.drive_entries where id = p_id;

  if not found then
    raise exception 'Item not found.' using errcode = 'P0002';
  end if;

  if v_ts is null then
    return 0;
  end if;

  with recursive subtree as (
    select id from chaenix.drive_entries where id = p_id
    union all
    select c.id
    from chaenix.drive_entries c
    join subtree s on c.parent_id = s.id
  )
  update chaenix.drive_entries e
  set deleted_at = null
  where e.id in (select id from subtree)
    and e.deleted_at = v_ts;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Storage object keys for a subtree, so the app can remove bytes before rows.
create or replace function chaenix.drive_purge_paths(p_id uuid)
returns setof text
language sql
stable
security invoker
set search_path = chaenix
as $$
  with recursive subtree as (
    select id, storage_path from chaenix.drive_entries where id = p_id
    union all
    select c.id, c.storage_path
    from chaenix.drive_entries c
    join subtree s on c.parent_id = s.id
  )
  select storage_path from subtree where storage_path is not null;
$$;

-- Permanently delete a trashed subtree. Only the root row is deleted here;
-- `on delete cascade` removes descendants atomically.
create or replace function chaenix.drive_purge(p_id uuid)
returns integer
language plpgsql
security invoker
set search_path = chaenix
as $$
declare
  v_deleted_at timestamptz;
  v_has_live boolean;
  v_ids uuid[];
  v_count integer;
begin
  select deleted_at into v_deleted_at from chaenix.drive_entries where id = p_id;

  if not found then
    raise exception 'Item not found.' using errcode = 'P0002';
  end if;

  if v_deleted_at is null then
    raise exception 'Only trashed items can be permanently deleted.' using errcode = 'P0001';
  end if;

  -- materialize the subtree first so the recursive read is not evaluated
  -- against a concurrently-modifying table
  select array_agg(sub.id), bool_or(sub.deleted_at is null)
  into v_ids, v_has_live
  from (
    with recursive subtree as (
      select id, deleted_at from chaenix.drive_entries where id = p_id
      union all
      select c.id, c.deleted_at
      from chaenix.drive_entries c
      join subtree s on c.parent_id = s.id
    )
    select id, deleted_at from subtree
  ) as sub;

  if v_has_live then
    raise exception 'Cannot permanently delete: the folder still contains live items.'
      using errcode = 'P0001';
  end if;

  delete from chaenix.drive_entries where id = any(v_ids);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Move one live entry into a live target folder, rejecting cycles and trashed
-- endpoints. A live-name conflict surfaces as 23505.
create or replace function chaenix.drive_move(p_id uuid, p_target uuid)
returns void
language plpgsql
security invoker
set search_path = chaenix
as $$
declare
  v_src_deleted timestamptz;
  v_target_deleted timestamptz;
begin
  select deleted_at into v_src_deleted from chaenix.drive_entries where id = p_id;

  if not found then
    raise exception 'Item not found.' using errcode = 'P0002';
  end if;

  if v_src_deleted is not null then
    raise exception 'This item is in the Trash.' using errcode = 'P0001';
  end if;

  if p_id = p_target then
    raise exception 'Cannot move an item into itself.' using errcode = 'P0001';
  end if;

  select deleted_at into v_target_deleted from chaenix.drive_entries where id = p_target;

  if not found then
    raise exception 'Destination folder not found.' using errcode = 'P0002';
  end if;

  if v_target_deleted is not null then
    raise exception 'The destination folder is in the Trash.' using errcode = 'P0001';
  end if;

  if exists (
    with recursive ancestors as (
      select id, parent_id from chaenix.drive_entries where id = p_target
      union all
      select a.id, a.parent_id
      from chaenix.drive_entries a
      join ancestors anc on a.id = anc.parent_id
    )
    select 1 from ancestors where id = p_id
  ) then
    raise exception 'Cannot move a folder into its own subfolder.' using errcode = 'P0001';
  end if;

  update chaenix.drive_entries set parent_id = p_target where id = p_id;
end;
$$;

-- Private to the server: never grant anon/authenticated on chaenix.
grant usage on schema chaenix to service_role;
grant all privileges on all tables in schema chaenix to service_role;
grant execute on all functions in schema chaenix to service_role;
alter default privileges in schema chaenix grant all on tables to service_role;
alter default privileges in schema chaenix grant execute on functions to service_role;
