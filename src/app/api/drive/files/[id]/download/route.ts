import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { DRIVE_ID_SCHEMA } from "@/lib/drive-api";
import { downloadFile, driveErrorResponse } from "@/lib/drive-store";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = DRIVE_ID_SCHEMA.safeParse(id);

  if (!parsedId.success) {
    return Response.json({ error: "Invalid id." }, { status: 400 });
  }

  try {
    const { entry, stream, contentLength } = await downloadFile(parsedId.data);

    const headers = new Headers({
      "Content-Type": entry.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(entry.name)}`,
      "Cache-Control": "no-store",
    });

    if (contentLength !== undefined) {
      headers.set("Content-Length", String(contentLength));
    }

    return new Response(stream, { headers });
  } catch (error) {
    return driveErrorResponse(error);
  }
}
