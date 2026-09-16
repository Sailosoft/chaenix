import {
  DriveConflictError,
  DriveConfigError,
  DriveError,
  DriveInputError,
  DriveNotFoundError,
  DriveUpstreamError,
} from "@/lib/drive-errors";
import { getBucket, getSupabaseAdmin } from "@/lib/supabase";

export {
  DriveConflictError,
  DriveConfigError,
  DriveError,
  DriveInputError,
  DriveNotFoundError,
  DriveUpstreamError,
} from "@/lib/drive-errors";

export type DriveOrderBy = "name" | "modified" | "size";

export type DriveEntry = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  isFolder: boolean;
  deletedAt?: string;
};

export type BulkResult = {
  moved: string[];
  deleted: string[];
  restored: string[];
  purged: string[];
  failed: { id: string; name?: string; error: string }[];
};

type DriveRow = {
  id: string;
  parent_id: string | null;
  name: string;
  is_folder: boolean;
  storage_path: string | null;
  mime_type: string;
  size_bytes: number | string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type PostgrestLikeError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

const PAGE_SIZE = 50;
const BULK_CONCURRENCY = 5;
const ORDER_BY_VALUES: DriveOrderBy[] = ["name", "modified", "size"];
const ORDER_BY_ERROR = "Invalid orderBy.";

function readSchemaName(): string {
  return process.env.SUPABASE_DB_SCHEMA?.trim() || "chaenix";
}

function configMessage(): string {
  return `Storage is not configured correctly: the "${readSchemaName()}" schema, "drive_entries" table, or drive functions are not available to PostgREST. Apply db/sql/0001_chaenix_drive.sql and expose the schema (Project Settings -> API -> Exposed schemas).`;
}

function mapDbError(error: unknown, fallbackMessage: string): DriveError {
  if (error instanceof DriveError) {
    return error;
  }

  const err = (error ?? {}) as PostgrestLikeError;
  const code = err.code ?? "";
  const message = err.message?.trim();

  if (
    code === "PGRST106" ||
    code === "PGRST205" ||
    code === "PGRST202" ||
    code === "42P01" ||
    code === "42883"
  ) {
    console.error(`[drive] PostgREST schema/table/function unavailable (${code})`, err);
    return new DriveConfigError(configMessage());
  }

  if (code === "23505") {
    return new DriveConflictError("An item with that name already exists here.");
  }

  if (code === "23514") {
    return new DriveInputError(message || "Name must not be empty or contain '/'.");
  }

  if (code === "22P02") {
    return new DriveInputError("Invalid id.");
  }

  if (code === "P0002") {
    return new DriveNotFoundError(message || "Item not found.");
  }

  if (code === "P0001") {
    return new DriveConflictError(message || "This action is not allowed.");
  }

  if (code === "PGRST116") {
    return new DriveNotFoundError("Item not found.");
  }

  console.error(`[drive] database request failed (${code || "unknown"})`, err);

  return new DriveUpstreamError(message || fallbackMessage);
}

function mapStorageError(error: unknown, fallbackMessage: string): DriveError {
  if (error instanceof DriveError) {
    return error;
  }

  const err = (error ?? {}) as { message?: string; error?: string; statusCode?: string | number };
  const message = err.message?.trim() || err.error?.trim();

  console.error("[drive] storage request failed", err);

  return new DriveUpstreamError(message || fallbackMessage);
}

function assertName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed || trimmed.includes("/")) {
    throw new DriveInputError("Name must not be empty or contain '/'.");
  }

  return trimmed;
}

function parseOrderBy(value?: string | null): DriveOrderBy {
  const raw = value?.trim();

  if (!raw) {
    return "name";
  }

  if (!ORDER_BY_VALUES.includes(raw as DriveOrderBy)) {
    throw new DriveInputError(ORDER_BY_ERROR);
  }

  return raw as DriveOrderBy;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

function decodeCursor(token?: string | null): number {
  if (!token) {
    return 0;
  }

  try {
    const offset = Number.parseInt(Buffer.from(token, "base64url").toString("utf8"), 10);

    return Number.isFinite(offset) && offset > 0 ? offset : 0;
  } catch {
    return 0;
  }
}

function toEntry(row: DriveRow): DriveEntry {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    size: row.size_bytes === null || row.size_bytes === undefined ? undefined : String(row.size_bytes),
    modifiedTime: row.updated_at,
    isFolder: row.is_folder,
    deletedAt: row.deleted_at ?? undefined,
  };
}

function emptyBulkResult(): BulkResult {
  return { moved: [], deleted: [], restored: [], purged: [], failed: [] };
}

function fail(result: BulkResult, id: string, error: unknown, fallback: string, name?: string): void {
  const mapped = error instanceof DriveError ? error : mapDbError(error, fallback);

  result.failed.push({ id, name, error: mapped.message });
}

async function runBounded<T>(items: T[], worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;

  const runners = Array.from({ length: Math.min(BULK_CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;

      await worker(item);
    }
  });

  await Promise.all(runners);
}

async function loadEntry(id: string): Promise<DriveRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("drive_entries").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw mapDbError(error, "Could not load the item.");
  }

  if (!data) {
    throw new DriveNotFoundError("Item not found.");
  }

  return data as unknown as DriveRow;
}

async function loadName(id: string): Promise<string | undefined> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("drive_entries").select("name").eq("id", id).maybeSingle();

  if (error || !data) {
    return undefined;
  }

  return (data as unknown as { name: string }).name;
}

async function enrichFailedNames(result: BulkResult): Promise<void> {
  if (result.failed.length === 0) {
    return;
  }

  const ids = Array.from(new Set(result.failed.map((failure) => failure.id)));
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("drive_entries").select("id,name").in("id", ids);

  if (error || !data) {
    return;
  }

  const names = new Map<string, string>();

  for (const row of data as unknown as { id: string; name: string }[]) {
    names.set(row.id, row.name);
  }

  for (const failure of result.failed) {
    if (!failure.name) {
      failure.name = names.get(failure.id);
    }
  }
}

async function assertLiveParent(parentId: string | null): Promise<void> {
  if (!parentId) {
    return;
  }

  const parent = await loadEntry(parentId);

  if (parent.deleted_at) {
    throw new DriveConflictError("The destination folder is in the Trash.");
  }
}

async function liveNameExists(parentId: string | null, name: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("drive_entries").select("id").is("deleted_at", null).ilike("name", escapeLike(name));

  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw mapDbError(error, "Could not check the name.");
  }

  return Boolean(data);
}

async function callRpc(fn: string, args: Record<string, unknown>, fallbackMessage: string): Promise<unknown> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc(fn, args);

  if (error) {
    throw mapDbError(error, fallbackMessage);
  }

  return data;
}

export async function listFolder(options: {
  folderId?: string | null;
  pageToken?: string | null;
  search?: string | null;
  orderBy?: string | null;
  trashed?: boolean;
}): Promise<{ items: DriveEntry[]; nextPageToken: string | null }> {
  const supabase = getSupabaseAdmin();
  const offset = decodeCursor(options.pageToken);
  const search = options.search?.trim();

  if (options.trashed) {
    let query = supabase.from("drive_trash").select("*");

    if (search) {
      query = query.ilike("name", `%${escapeLike(search)}%`);
    }

    const { data, error } = await query
      .order("deleted_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw mapDbError(error, "Could not load the Trash.");
    }

    const rows = (data ?? []) as unknown as DriveRow[];

    return {
      items: rows.map(toEntry),
      nextPageToken: rows.length === PAGE_SIZE ? encodeCursor(offset + PAGE_SIZE) : null,
    };
  }

  const orderBy = parseOrderBy(options.orderBy);
  let query = supabase.from("drive_entries").select("*").is("deleted_at", null);

  query = options.folderId ? query.eq("parent_id", options.folderId) : query.is("parent_id", null);

  if (search) {
    query = query.ilike("name", `%${escapeLike(search)}%`);
  }

  query = query.order("is_folder", { ascending: false });

  if (orderBy === "name") {
    query = query.order("name", { ascending: true });
  } else if (orderBy === "modified") {
    query = query.order("updated_at", { ascending: false });
  } else {
    query = query.order("size_bytes", { ascending: false, nullsFirst: false });
  }

  const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    throw mapDbError(error, "Could not load the folder.");
  }

  const rows = (data ?? []) as unknown as DriveRow[];

  return {
    items: rows.map(toEntry),
    nextPageToken: rows.length === PAGE_SIZE ? encodeCursor(offset + PAGE_SIZE) : null,
  };
}

export async function createFolder(name: string, parentId?: string | null): Promise<DriveEntry> {
  const supabase = getSupabaseAdmin();
  const safeName = assertName(name);
  const parent = parentId ?? null;

  await assertLiveParent(parent);

  const { data, error } = await supabase
    .from("drive_entries")
    .insert({ name: safeName, parent_id: parent, is_folder: true })
    .select("*")
    .single();

  if (error) {
    throw mapDbError(error, "Could not create the folder.");
  }

  return toEntry(data as unknown as DriveRow);
}

export async function renameEntry(id: string, name: string): Promise<DriveEntry> {
  const supabase = getSupabaseAdmin();
  const safeName = assertName(name);
  const existing = await loadEntry(id);

  if (existing.deleted_at) {
    throw new DriveConflictError("This item is in the Trash.");
  }

  const { data, error } = await supabase
    .from("drive_entries")
    .update({ name: safeName })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw mapDbError(error, "Could not rename the item.");
  }

  return toEntry(data as unknown as DriveRow);
}

export async function moveEntries(ids: string[], targetFolderId: string): Promise<BulkResult> {
  const result = emptyBulkResult();
  const target = await loadEntry(targetFolderId);

  if (target.deleted_at) {
    throw new DriveConflictError("The destination folder is in the Trash.");
  }

  if (!target.is_folder) {
    throw new DriveInputError("The destination is not a folder.");
  }

  await runBounded(ids, async (id) => {
    if (id === targetFolderId) {
      result.failed.push({ id, error: "Cannot move an item into itself." });
      return;
    }

    try {
      await callRpc("drive_move", { p_id: id, p_target: targetFolderId }, "Move failed.");
      result.moved.push(id);
    } catch (error) {
      fail(result, id, error, "Move failed.");
    }
  });

  await enrichFailedNames(result);

  return result;
}

export async function deleteEntries(ids: string[]): Promise<BulkResult> {
  const result = emptyBulkResult();

  await runBounded(ids, async (id) => {
    try {
      await callRpc("drive_soft_delete", { p_id: id }, "Delete failed.");
      result.deleted.push(id);
    } catch (error) {
      fail(result, id, error, "Delete failed.");
    }
  });

  await enrichFailedNames(result);

  return result;
}

export async function restoreEntries(ids: string[]): Promise<BulkResult> {
  const result = emptyBulkResult();
  const supabase = getSupabaseAdmin();

  await runBounded(ids, async (id) => {
    const { error } = await supabase.rpc("drive_restore", { p_id: id });

    if (!error) {
      result.restored.push(id);
      return;
    }

    if ((error as PostgrestLikeError).code === "23505") {
      const name = await loadName(id);

      result.failed.push({
        id,
        name,
        error: `Cannot restore ${name ? `"${name}"` : "this item"}: an item with that name already exists in the destination folder.`,
      });
      return;
    }

    fail(result, id, error, "Restore failed.");
  });

  await enrichFailedNames(result);

  return result;
}

export async function purgeEntries(ids: string[]): Promise<BulkResult> {
  const result = emptyBulkResult();
  const supabase = getSupabaseAdmin();
  const bucket = getBucket();

  await runBounded(ids, async (id) => {
    let paths: string[];

    try {
      const data = await callRpc("drive_purge_paths", { p_id: id }, "Could not load the item contents.");

      paths = (data ?? []) as string[];
    } catch (error) {
      fail(result, id, error, "Could not load the item contents.");
      return;
    }

    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from(bucket).remove(paths);

      if (removeError) {
        fail(result, id, mapStorageError(removeError, "Could not remove the stored contents."), "Could not remove the stored contents.");
        return;
      }
    }

    try {
      await callRpc("drive_purge", { p_id: id }, "Delete forever failed.");
      result.purged.push(id);
    } catch (error) {
      fail(result, id, error, "Delete forever failed.");
    }
  });

  return result;
}

export async function uploadFile(input: {
  id: string;
  name: string;
  mimeType: string;
  parentId?: string | null;
  body: ArrayBuffer;
}): Promise<DriveEntry> {
  const supabase = getSupabaseAdmin();
  const bucket = getBucket();
  const safeName = assertName(input.name);
  const mimeType = input.mimeType.trim() || "application/octet-stream";
  const parent = input.parentId ?? null;

  await assertLiveParent(parent);

  if (await liveNameExists(parent, safeName)) {
    throw new DriveConflictError("An item with that name already exists here.");
  }

  if (input.body.byteLength === 0) {
    throw new DriveInputError("The uploaded file is empty.");
  }

  const storagePath = `objects/${input.id}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, input.body, {
    contentType: mimeType,
    upsert: false,
    metadata: { name: safeName, parentId: parent },
  });

  if (uploadError) {
    throw mapStorageError(uploadError, "Could not store the uploaded file.");
  }

  const { data, error } = await supabase
    .from("drive_entries")
    .insert({
      id: input.id,
      parent_id: parent,
      name: safeName,
      is_folder: false,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: input.body.byteLength,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(bucket).remove([storagePath]);

    throw mapDbError(error, "Could not save the uploaded file.");
  }

  return toEntry(data as unknown as DriveRow);
}

export async function downloadFile(
  id: string,
): Promise<{ entry: DriveEntry; stream: ReadableStream; contentLength?: number }> {
  const supabase = getSupabaseAdmin();
  const row = await loadEntry(id);

  if (row.deleted_at) {
    throw new DriveConflictError("This item is in the Trash.");
  }

  if (row.is_folder) {
    throw new DriveInputError("Folders cannot be downloaded.");
  }

  if (!row.storage_path) {
    throw new DriveUpstreamError("This file has no stored contents.");
  }

  const { data, error } = await supabase.storage.from(getBucket()).createSignedUrl(row.storage_path, 60);

  if (error || !data?.signedUrl) {
    throw mapStorageError(error ?? new Error("No signed URL returned."), "Could not prepare the download.");
  }

  const res = await fetch(data.signedUrl);

  if (!res.ok || !res.body) {
    console.error(`[drive] signed download failed with status ${res.status}`);
    throw new DriveUpstreamError("Could not download the file contents.");
  }

  let contentLength: number | undefined;

  if (row.size_bytes !== null && row.size_bytes !== undefined) {
    const parsed = Number(row.size_bytes);

    if (Number.isFinite(parsed)) {
      contentLength = parsed;
    }
  }

  return { entry: toEntry(row), stream: res.body, contentLength };
}

export function driveErrorResponse(error: unknown): Response {
  if (error instanceof DriveError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("[drive] unexpected error", error);

  return Response.json({ error: "Storage request failed." }, { status: 500 });
}
