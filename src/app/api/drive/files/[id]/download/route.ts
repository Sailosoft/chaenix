import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { downloadFile, gdriveErrorResponse } from "@/lib/gdrive";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { entry, stream } = await downloadFile(id);

    const headers = new Headers({
      "Content-Type": entry.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(entry.name)}`,
      "Cache-Control": "no-store",
    });

    if (entry.size) {
      headers.set("Content-Length", entry.size);
    }

    return new Response(stream, { headers });
  } catch (error) {
    return gdriveErrorResponse(error);
  }
}
