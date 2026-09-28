import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { buildClientModelList, getNativeSettings } from "@/lib/ai/provider";

import { SettingsUi } from "./settings-ui";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/settings");
  }

  const models = buildClientModelList();
  const native = getNativeSettings();

  return <SettingsUi models={models} native={native} />;
}
