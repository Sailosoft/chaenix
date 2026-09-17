import "server-only";

import { createClient } from "@supabase/supabase-js";

import { DriveConfigError } from "@/lib/drive-errors";

export type SupabaseEnv = {
  url: string;
  secretKey: string;
  schema: string;
  bucket: string;
};

export function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    const missing = [!url ? "SUPABASE_URL" : null, !secretKey ? "SUPABASE_SECRET_KEY" : null]
      .filter((value): value is string => value !== null)
      .join(", ");

    throw new DriveConfigError(`Storage is not configured. Set ${missing}.`);
  }

  return {
    url,
    secretKey,
    schema: process.env.SUPABASE_DB_SCHEMA?.trim() || "chaenix",
    bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "drive",
  };
}

function createAdminClient() {
  const { url, secretKey, schema } = readSupabaseEnv();

  return createClient(url, secretKey, {
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
