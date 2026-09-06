import { z } from "zod";

import {
  DRIVE_ID_SCHEMA,
  isAdminSession,
  parseJsonBody,
  unauthorizedResponse,
} from "@/lib/drive-api";
import { gdriveErrorResponse, startResumableUpload } from "@/lib/gdrive";

export const runtime = "nodejs";

const uploadSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  parentId: DRIVE_ID_SCHEMA.optional(),
});

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return unauthorizedResponse();
  }

  const parsed = await parseJsonBody(req, uploadSchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const uploadUrl = await startResumableUpload(
      parsed.data.name,
      parsed.data.mimeType,
      parsed.data.parentId,
    );

    return Response.json({ uploadUrl });
  } catch (error) {
    return gdriveErrorResponse(error);
  }
}
