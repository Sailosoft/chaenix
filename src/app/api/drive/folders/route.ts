import { z } from "zod";

import { DRIVE_ID_SCHEMA, isAdminSession, parseJsonBody, unauthorizedResponse } from "@/lib/drive-api";
import { createFolder, gdriveErrorResponse } from "@/lib/gdrive";

export const runtime = "nodejs";

const folderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: DRIVE_ID_SCHEMA.optional(),
});

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return unauthorizedResponse();
  }

  const parsed = await parseJsonBody(req, folderSchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const entry = await createFolder(parsed.data.name, parsed.data.parentId);

    return Response.json(entry, { status: 201 });
  } catch (error) {
    return gdriveErrorResponse(error);
  }
}
