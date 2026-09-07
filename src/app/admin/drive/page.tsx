import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

import { DriveUi } from "./drive-ui";

export default async function AdminDrivePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/drive");
  }

  return <DriveUi />;
}
