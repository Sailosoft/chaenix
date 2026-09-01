import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

import { HistoryUi } from "./history-ui";

export default async function AdminHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/history");
  }

  return <HistoryUi />;
}
