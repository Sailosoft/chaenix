import { z } from "zod";

import { DRIVE_ID_SCHEMA, isAdminSession, parseJsonBody, unauthorizedResponse } from "@/lib/drive-api";
import {
  deleteEntries,
  driveErrorResponse,
  moveEntries,
  purgeEntries,
  restoreEntries,
} from "@/lib/drive-store";

export const runtime = "nodejs";

const bulkSchema = z
  .object({
    action: z.enum(["move", "delete", "restore", "purge"]),
    ids: z.array(DRIVE_ID_SCHEMA).min(1).max(100),
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

  const { action, ids, targetId } = parsed.data;

  try {
    const result =
      action === "move"
        ? await moveEntries(ids, targetId!)
        : action === "delete"
          ? await deleteEntries(ids)
          : action === "restore"
            ? await restoreEntries(ids)
            : await purgeEntries(ids);

    return Response.json({
      ok: result.failed.length === 0,
      moved: result.moved,
      deleted: result.deleted,
      restored: result.restored,
      purged: result.purged,
      failed: result.failed,
    });
  } catch (error) {
    return driveErrorResponse(error);
  }
}
