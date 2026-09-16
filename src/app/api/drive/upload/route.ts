import { randomUUID } from "node:crypto";

import { z } from "zod";

import { DRIVE_ID_SCHEMA, isAdminSession, unauthorizedResponse } from "@/lib/drive-api";
import { DriveInputError, driveErrorResponse, uploadFile } from "@/lib/drive-store";

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
    let body: ArrayBuffer;

    try {
      body = await req.arrayBuffer();
    } catch (err) {
      console.error("[drive] Failed to read upload request body:", err);
      throw new DriveInputError("Could not read the file being uploaded.");
    }

    const entry = await uploadFile({
      id: randomUUID(),
      name: name.data,
      mimeType: mimeType.data,
      parentId: parentId.data,
      body,
    });

    return Response.json(entry, { status: 201 });
  } catch (error) {
    return driveErrorResponse(error);
  }
}
