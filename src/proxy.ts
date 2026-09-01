import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/auth/signin", request.url);
  signInUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};