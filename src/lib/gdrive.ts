import { Readable } from "node:stream";

import { google, type drive_v3 } from "googleapis";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const ENTRY_FIELDS = "id,name,mimeType,size,modifiedTime";

type GdriveEnv = {
  clientEmail: string;
  privateKey: string;
  folderId: string;
};

export type DriveOrderBy = "name" | "modified" | "size";

export type DriveEntry = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  isFolder: boolean;
};

export class GdriveError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "GdriveError";
    this.status = status;
  }
}

export class GdriveConfigError extends GdriveError {
  constructor(message: string) {
    super(message, 500);
    this.name = "GdriveConfigError";
  }
}

export class GdriveInputError extends GdriveError {
  constructor(message: string) {
    super(message, 400);
    this.name = "GdriveInputError";
  }
}

export class GdriveNotFoundError extends GdriveError {
  constructor(message: string) {
    super(message, 404);
    this.name = "GdriveNotFoundError";
  }
}

export class GdriveNativeFileError extends GdriveError {
  constructor(message: string) {
    super(message, 409);
    this.name = "GdriveNativeFileError";
  }
}

export class GdriveUpstreamError extends GdriveError {
  constructor(message: string) {
    super(message, 502);
    this.name = "GdriveUpstreamError";
  }
}

function readEnv(): GdriveEnv {
  const clientEmail = process.env.GDRIVE_CLIENT_EMAIL;
  const rawKey = process.env.GDRIVE_PRIVATE_KEY;
  const folderId = process.env.GDRIVE_FOLDER_ID;

  if (!clientEmail || !rawKey || !folderId) {
    throw new GdriveConfigError(
      "Google Drive is not configured. Set GDRIVE_CLIENT_EMAIL, GDRIVE_PRIVATE_KEY and GDRIVE_FOLDER_ID.",
    );
  }

  return {
    clientEmail,
    privateKey: rawKey.replace(/\\n/g, "\n"),
    folderId,
  };
}

let jwtClient: InstanceType<typeof google.auth.JWT> | null = null;
let driveClient: drive_v3.Drive | null = null;

export function getJwtClient(): InstanceType<typeof google.auth.JWT> {
  if (!jwtClient) {
    const { clientEmail, privateKey } = readEnv();

    jwtClient = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [DRIVE_SCOPE],
    });
  }

  return jwtClient;
}

export function getDrive(): drive_v3.Drive {
  if (!driveClient) {
    driveClient = google.drive({ version: "v3", auth: getJwtClient() });
  }

  return driveClient;
}

export function getRootFolderId(): string {
  return readEnv().folderId;
}

function extractIdFromUrl(value: string): string | null {
  const match = value.match(/\/folders\/([A-Za-z0-9_-]{1,64})(?:[/?#]|$)/);

  return match ? match[1] : null;
}

export function assertFolderId(folderId?: string | null): string {
  const raw = folderId && folderId.trim() !== "" ? folderId.trim() : getRootFolderId();

  if (ID_PATTERN.test(raw)) {
    return raw;
  }

  const extracted = extractIdFromUrl(raw);

  if (extracted) {
    return extracted;
  }

  throw new GdriveInputError(
    `Invalid folder id: "${raw}". Expected a Drive folder ID (e.g. 1AbCdEfGhIjK), not a URL.`,
  );
}

export function assertFileId(fileId: string): string {
  if (!ID_PATTERN.test(fileId)) {
    throw new GdriveInputError("Invalid file id.");
  }

  return fileId;
}

export function assertName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed || trimmed.includes("/")) {
    throw new GdriveInputError("Name must not be empty or contain '/'.");
  }

  return trimmed;
}

export function escapeQ(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

type GaxiosLikeError = {
  response?: {
    status?: number;
    data?: { error?: { message?: string } };
  };
};

function googleMessage(err: unknown): string | null {
  const response = (err as GaxiosLikeError | null)?.response;

  return response?.data?.error?.message ?? null;
}

function asGdriveError(err: unknown, notFoundMessage: string): GdriveError {
  if (err instanceof GdriveError) {
    return err;
  }

  const status = (err as GaxiosLikeError | null)?.response?.status;
  const message = googleMessage(err);

  if (status === 404) {
    return new GdriveNotFoundError(notFoundMessage);
  }

  if (status === 403) {
    return new GdriveNotFoundError(message ?? notFoundMessage);
  }

  if (status !== undefined && status >= 400 && status < 500) {
    return new GdriveInputError(message ?? "Invalid Drive request.");
  }

  return new GdriveUpstreamError(message ?? "Drive request failed.");
}

function toEntry(file: drive_v3.Schema$File): DriveEntry {
  return {
    id: file.id ?? "",
    name: file.name ?? "",
    mimeType: file.mimeType ?? "application/octet-stream",
    size: file.size ?? undefined,
    modifiedTime: file.modifiedTime ?? "",
    isFolder: file.mimeType === FOLDER_MIME_TYPE,
  };
}

const ORDER_BY_MAP: Record<DriveOrderBy, string> = {
  name: "name",
  modified: "modifiedTime desc",
  size: "quotaBytesUsed desc",
};

const ORDER_BY_VALUES: string[] = ["name", "modified", "size"];

export async function listFolder(options: {
  folderId?: string | null;
  pageToken?: string | null;
  search?: string | null;
  orderBy?: string | null;
}): Promise<{ items: DriveEntry[]; nextPageToken: string | null }> {
  const drive = getDrive();
  const folderId = assertFolderId(options.folderId);

  let orderBy: DriveOrderBy = "name";

  if (options.orderBy) {
    if (!ORDER_BY_VALUES.includes(options.orderBy as DriveOrderBy)) {
      throw new GdriveInputError("Invalid orderBy.");
    }

    orderBy = options.orderBy as DriveOrderBy;
  }

  const search = options.search?.trim();
  let query = `'${folderId}' in parents and trashed = false`;

  if (search) {
    query += ` and name contains '${escapeQ(search)}'`;
  }

  try {
    const res = await drive.files.list({
      q: query,
      pageToken: options.pageToken || undefined,
      pageSize: 200,
      orderBy: ORDER_BY_MAP[orderBy],
      fields: `nextPageToken,files(${ENTRY_FIELDS})`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return {
      items: (res.data.files ?? []).map(toEntry),
      nextPageToken: res.data.nextPageToken ?? null,
    };
  } catch (err) {
    console.error("[gdrive] listFolder failed:", err);
    throw asGdriveError(err, "Folder not accessible.");
  }
}

export async function createFolder(name: string, parentId?: string | null): Promise<DriveEntry> {
  const drive = getDrive();
  const safeName = assertName(name);
  const folderId = assertFolderId(parentId);

  try {
    const res = await drive.files.create({
      requestBody: {
        name: safeName,
        mimeType: FOLDER_MIME_TYPE,
        parents: [folderId],
      },
      fields: ENTRY_FIELDS,
      supportsAllDrives: true,
    });

    return toEntry(res.data);
  } catch (err) {
    throw asGdriveError(err, "Folder not accessible.");
  }
}

export async function renameFile(fileId: string, name: string): Promise<DriveEntry> {
  const drive = getDrive();
  const id = assertFileId(fileId);
  const safeName = assertName(name);

  try {
    const res = await drive.files.update({
      fileId: id,
      requestBody: { name: safeName },
      fields: ENTRY_FIELDS,
      supportsAllDrives: true,
    });

    return toEntry(res.data);
  } catch (err) {
    throw asGdriveError(err, "File not found.");
  }
}

export async function moveFile(fileId: string, targetFolderId: string): Promise<DriveEntry> {
  const drive = getDrive();
  const id = assertFileId(fileId);
  const targetId = assertFolderId(targetFolderId);

  try {
    const current = await drive.files.get({
      fileId: id,
      fields: "parents",
      supportsAllDrives: true,
    });

    const parents = (current.data.parents ?? []).filter(
      (parent): parent is string => Boolean(parent),
    );

    if (parents.includes(targetId)) {
      const res = await drive.files.get({
        fileId: id,
        fields: ENTRY_FIELDS,
        supportsAllDrives: true,
      });

      return toEntry(res.data);
    }

    const removeParents = parents.filter((parent) => parent !== targetId).join(",");

    const res = await drive.files.update({
      fileId: id,
      addParents: targetId,
      removeParents: removeParents || undefined,
      fields: ENTRY_FIELDS,
      supportsAllDrives: true,
    });

    return toEntry(res.data);
  } catch (err) {
    throw asGdriveError(err, "File not found.");
  }
}

export type BulkResult = {
  moved: string[];
  deleted: string[];
  failed: { id: string; name?: string; error: string }[];
};

export async function moveEntries(ids: string[], targetFolderId: string): Promise<BulkResult> {
  const targetId = assertFolderId(targetFolderId);
  const result: BulkResult = { moved: [], deleted: [], failed: [] };

  for (const id of ids) {
    try {
      const entry = await moveFile(id, targetId);
      result.moved.push(entry.id);
    } catch (err) {
      result.failed.push({
        id,
        error: err instanceof GdriveError ? err.message : "Move failed.",
      });
    }
  }

  return result;
}

export async function deleteToTrash(fileId: string): Promise<void> {
  const drive = getDrive();
  const id = assertFileId(fileId);

  try {
    await drive.files.delete({ fileId: id, supportsAllDrives: true });
  } catch (err) {
    throw asGdriveError(err, "File not found.");
  }
}

export async function deleteEntries(ids: string[]): Promise<BulkResult> {
  const result: BulkResult = { moved: [], deleted: [], failed: [] };

  for (const id of ids) {
    try {
      await deleteToTrash(id);
      result.deleted.push(id);
    } catch (err) {
      result.failed.push({
        id,
        error: err instanceof GdriveError ? err.message : "Delete failed.",
      });
    }
  }

  return result;
}

export async function downloadFile(
  fileId: string,
): Promise<{ entry: DriveEntry; stream: ReadableStream }> {
  const drive = getDrive();
  const id = assertFileId(fileId);

  let entry: DriveEntry;

  try {
    const meta = await drive.files.get({
      fileId: id,
      fields: ENTRY_FIELDS,
      supportsAllDrives: true,
    });

    entry = toEntry(meta.data);
  } catch (err) {
    throw asGdriveError(err, "File not found.");
  }

  if (entry.mimeType.startsWith("application/vnd.google-apps.")) {
    throw new GdriveNativeFileError(
      `"${entry.name}" is a Google-native file and has no downloadable media in v1.`,
    );
  }

  try {
    const res = await drive.files.get(
      { fileId: id, alt: "media", supportsAllDrives: true },
      { responseType: "stream" },
    );

    const nodeStream = res.data as unknown as Readable;

    return { entry, stream: Readable.toWeb(nodeStream) as ReadableStream };
  } catch (err) {
    throw asGdriveError(err, "File not found.");
  }
}

export async function startResumableUpload(
  name: string,
  mimeType: string,
  parentId?: string | null,
): Promise<string> {
  const safeName = assertName(name);
  const folderId = assertFolderId(parentId);

  let token: string | null = null;

  try {
    const auth = await getJwtClient().getAccessToken();
    token = auth?.token ?? null;
  } catch {
    throw new GdriveConfigError(
      "Could not authenticate with Google Drive. Check GDRIVE_CLIENT_EMAIL and GDRIVE_PRIVATE_KEY.",
    );
  }

  if (!token) {
    throw new GdriveUpstreamError("Could not obtain a Google access token.");
  }

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
      },
      body: JSON.stringify({
        name: safeName,
        mimeType,
        parents: [folderId],
        supportsAllDrives: true,
      }),
    },
  );

  if (!res.ok) {
    let message = "Could not start Drive upload session.";

    try {
      const data = (await res.json()) as { error?: { message?: string } };
      message = data.error?.message ?? message;
    } catch {
      // keep default message
    }

    if (res.status === 404 || res.status === 403) {
      throw new GdriveNotFoundError("Folder not accessible.");
    }

    throw new GdriveUpstreamError(message);
  }

  const location = res.headers.get("location");

  if (!location) {
    throw new GdriveUpstreamError("Google did not return an upload session URL.");
  }

  return location;
}

export async function uploadStreamToUrl(
  uploadUrl: string,
  body: ReadableStream | null,
  mimeType: string,
): Promise<void> {
  const buffer = await new Response(body).arrayBuffer();

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: buffer,
  });

  if (!res.ok) {
    let message = "Google rejected the upload.";

    try {
      const data = (await res.json()) as { error?: { message?: string } };
      message = data.error?.message ?? message;
    } catch {
      // keep default message
    }

    throw new GdriveUpstreamError(message);
  }
}

export function gdriveErrorResponse(error: unknown): Response {
  if (error instanceof GdriveError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("[gdrive] unexpected error", error);

  return Response.json({ error: "Drive request failed." }, { status: 500 });
}
