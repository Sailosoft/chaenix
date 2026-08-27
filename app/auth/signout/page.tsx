"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.replace("/auth/signin?callbackUrl=/admin");
    router.refresh();
  }

  return (
    <main
      className={`${titleFont.variable} ${uiFont.variable} relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#93c5fd55_0%,transparent_44%),radial-gradient(circle_at_90%_90%,#67e8f966_0%,transparent_46%),linear-gradient(145deg,#f8fbff_0%,#e0f2fe_52%,#eff6ff_100%)] px-6 py-16`}
    >
      <section className="relative z-10 w-full max-w-xl rounded-3xl border border-sky-100/80 bg-white/85 p-9 text-center shadow-[0_26px_60px_-32px_rgba(56,189,248,0.4)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 [font-family:var(--font-ui)]">
          Secure Session
        </p>
        <h1 className="mt-3 text-4xl text-slate-900 [font-family:var(--font-title)]">
          Ready to sign out?
        </h1>
        <p className="mt-4 text-sm text-slate-600 [font-family:var(--font-ui)]">
          This will close your admin session on this device.
        </p>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-8 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300 px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:brightness-105 [font-family:var(--font-ui)]"
        >
          Sign out now
        </button>
      </section>
    </main>
  );
}