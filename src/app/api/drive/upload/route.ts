import { z } from "zod";

import { DRIVE_ID_SCHEMA, isAdminSession, unauthorizedResponse } from "@/lib/drive-api";
import {
  gdriveErrorResponse,
  startResumableUpload,
  uploadStreamToUrl,
} from "@/lib/gdrive";

export const runtime = "nodejs";

const nameSchema = z.string().min(1).max(255);
const mimeTypeSchema = z.string().min(1).max(255);
const parentIdSchema = DRIVE_ID_SCHEMA.optional();

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return unauthorizedResponse();
  }

  const nameRaw = req.headers.get("x-file-name");
  const mimeRaw = req.headers.get("content-type");
  const parentRaw = req.headers.get("x-parent-id") || undefined;

  const name = nameSchema.safeParse(nameRaw);
  const mimeType = mimeTypeSchema.safeParse(mimeRaw);
  const parentId = parentRaw === undefined ? { success: true as const, data: undefined } : parentIdSchema.safeParse(parentRaw);

  if (!name.success || !mimeType.success || !parentId.success) {
    return Response.json({ error: "Invalid upload metadata." }, { status: 400 });
  }

  try {
    const uploadUrl = await startResumableUpload(name.data, mimeType.data, parentId.data);

    await uploadStreamToUrl(uploadUrl, req.body, mimeType.data);

    return Response.json({ ok: true });
  } catch (error) {
    return gdriveErrorResponse(error);
  }
}
