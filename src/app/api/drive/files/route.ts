import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { gdriveErrorResponse, listFolder } from "@/lib/gdrive";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);

    const data = await listFolder({
      folderId: url.searchParams.get("folderId"),
      pageToken: url.searchParams.get("pageToken"),
      search: url.searchParams.get("search"),
      orderBy: url.searchParams.get("orderBy"),
    });

    return Response.json(data);
  } catch (error) {
    return gdriveErrorResponse(error);
  }
}
