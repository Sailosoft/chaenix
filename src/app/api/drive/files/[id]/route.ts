import { z } from "zod";

import { isAdminSession, parseJsonBody, unauthorizedResponse } from "@/lib/drive-api";
import { deleteToTrash, gdriveErrorResponse, renameFile } from "@/lib/gdrive";

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
  const parsed = await parseJsonBody(req, renameSchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const entry = await renameFile(id, parsed.data.name);

    return Response.json(entry);
  } catch (error) {
    return gdriveErrorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  if (!(await isAdminSession())) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  try {
    await deleteToTrash(id);

    return Response.json({ ok: true });
  } catch (error) {
    return gdriveErrorResponse(error);
  }
}
