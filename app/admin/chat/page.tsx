import { generateId } from "ai";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function AdminChatStartPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/chat");
  }

  const id = generateId();
  redirect(`/admin/chat/${id}`);
}
