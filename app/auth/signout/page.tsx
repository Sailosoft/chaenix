"use client";

import { Playfair_Display, Space_Grotesk } from "next/font/google";
import { signOut } from "next-auth/react";

const titleFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-title",
  weight: ["600", "700"],
});

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "700"],
});

export default function SignOutPage() {
  return (
    <main
      className={`${titleFont.variable} ${uiFont.variable} relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#fb718540_0%,transparent_42%),radial-gradient(circle_at_90%_90%,#38bdf840_0%,transparent_45%),linear-gradient(145deg,#0f172a_0%,#1e293b_50%,#111827_100%)] px-6 py-16`}
    >
      <section className="relative z-10 w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 p-9 text-center backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 [font-family:var(--font-ui)]">
          Secure Session
        </p>
        <h1 className="mt-3 text-4xl text-white [font-family:var(--font-title)]">
          Ready to sign out?
        </h1>
        <p className="mt-4 text-sm text-cyan-50/80 [font-family:var(--font-ui)]">
          This will close your admin session on this device.
        </p>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="mt-8 rounded-2xl bg-gradient-to-r from-rose-300 via-orange-300 to-amber-200 px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-slate-900 transition hover:brightness-105 [font-family:var(--font-ui)]"
        >
          Sign out now
        </button>
      </section>
    </main>
  );
}