import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { buildClientModelList } from "@/lib/ai/provider";

import { ChatUi } from "../chat-ui";

export default async function AdminChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/chat");
  }

  const { id } = await params;
  const models = buildClientModelList();

  return <ChatUi id={id} initialMessages={[]} models={models} />;
}
