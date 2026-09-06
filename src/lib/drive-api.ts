import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";

export const DRIVE_ID_SCHEMA = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Invalid id.");

export async function isAdminSession(): Promise<boolean> {
  const session = await getServerSession(authOptions);

  return Boolean(session);
}

export function unauthorizedResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export type ParsedBody<T> = { data: T } | { error: Response };

export async function parseJsonBody<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<ParsedBody<z.infer<T>>> {
  let raw: unknown;

  try {
    raw = await req.json();
  } catch {
    return {
      error: Response.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    return {
      error: Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid request body." },
        { status: 400 },
      ),
    };
  }

  return { data: result.data };
}
