import { z } from "zod";

import { DRIVE_ID_SCHEMA, isAdminSession, parseJsonBody, unauthorizedResponse } from "@/lib/drive-api";
import { deleteEntries, gdriveErrorResponse, moveEntries } from "@/lib/gdrive";

export const runtime = "nodejs";

const bulkSchema = z
  .object({
    action: z.enum(["move", "delete"]),
    ids: z.array(DRIVE_ID_SCHEMA).min(1).max(500),
    targetId: DRIVE_ID_SCHEMA.optional(),
  })
  .refine((data) => data.action !== "move" || Boolean(data.targetId), {
    message: "targetId is required for move.",
  });

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return unauthorizedResponse();
  }

  const parsed = await parseJsonBody(req, bulkSchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const result =
      parsed.data.action === "move"
        ? await moveEntries(parsed.data.ids, parsed.data.targetId!)
        : await deleteEntries(parsed.data.ids);

    return Response.json({
      ok: result.failed.length === 0,
      moved: result.moved,
      deleted: result.deleted,
      failed: result.failed,
    });
  } catch (error) {
    return gdriveErrorResponse(error);
  }
}
