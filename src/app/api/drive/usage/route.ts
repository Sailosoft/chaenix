import { isAdminSession, unauthorizedResponse } from "@/lib/drive-api";
import { driveErrorResponse, readDriveUsage } from "@/lib/drive-store";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminSession())) {
    return unauthorizedResponse();
  }

  try {
    const usedBytes = await readDriveUsage();

    return Response.json({ usedBytes });
  } catch (error) {
    return driveErrorResponse(error);
  }
}
