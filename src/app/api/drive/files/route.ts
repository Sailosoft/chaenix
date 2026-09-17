import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { driveErrorResponse, listFolder } from "@/lib/drive-store";

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
      trashed: url.searchParams.get("trashed") === "true",
    });

    return Response.json(data);
  } catch (error) {
    return driveErrorResponse(error);
  }
}
