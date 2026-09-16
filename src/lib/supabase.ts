import "server-only";

import { createClient } from "@supabase/supabase-js";

import { DriveConfigError } from "@/lib/drive-errors";

export type SupabaseEnv = {
  url: string;
  serviceRoleKey: string;
  schema: string;
  bucket: string;
};

export function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    const missing = [!url ? "SUPABASE_URL" : null, !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null]
      .filter((value): value is string => value !== null)
      .join(", ");

    throw new DriveConfigError(`Storage is not configured. Set ${missing}.`);
  }

  return {
    url,
    serviceRoleKey,
    schema: process.env.SUPABASE_DB_SCHEMA?.trim() || "chaenix",
    bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "drive",
  };
}

function createAdminClient() {
  const { url, serviceRoleKey, schema } = readSupabaseEnv();

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema },
  });
}

type AdminClient = ReturnType<typeof createAdminClient>;

let adminClient: AdminClient | null = null;

export function getSupabaseAdmin(): AdminClient {
  if (!adminClient) {
    adminClient = createAdminClient();
  }

  return adminClient;
}

export function getBucket(): string {
  return readSupabaseEnv().bucket;
}
