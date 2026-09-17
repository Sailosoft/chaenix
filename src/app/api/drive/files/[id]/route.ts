import { z } from "zod";

import { DRIVE_ID_SCHEMA, isAdminSession, parseJsonBody, unauthorizedResponse } from "@/lib/drive-api";
import { deleteEntries, driveErrorResponse, renameEntry } from "@/lib/drive-store";

export const runtime = "nodejs";

const renameSchema = z.object({
  name: z.string().min(1).max(255),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  if (!(await isAdminSession())) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const parsedId = DRIVE_ID_SCHEMA.safeParse(id);

  if (!parsedId.success) {
    return Response.json({ error: "Invalid id." }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, renameSchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const entry = await renameEntry(parsedId.data, parsed.data.name);

    return Response.json(entry);
  } catch (error) {
    return driveErrorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  if (!(await isAdminSession())) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const parsedId = DRIVE_ID_SCHEMA.safeParse(id);

  if (!parsedId.success) {
    return Response.json({ error: "Invalid id." }, { status: 400 });
  }

  try {
    const result = await deleteEntries([parsedId.data]);

    if (result.failed.length > 0) {
      return Response.json({ error: result.failed[0].error }, { status: 409 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return driveErrorResponse(error);
  }
}
