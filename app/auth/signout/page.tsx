"use client";

import { useRouter } from "next/navigation";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import { signOut } from "next-auth/react";

import { AuthHeader } from "../auth-header";

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
      className={`${titleFont.variable} ${uiFont.variable} relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(168,193,230,0.42)_0%,transparent_44%),radial-gradient(circle_at_90%_90%,rgba(206,221,244,0.45)_0%,transparent_46%),linear-gradient(145deg,#f8fbff_0%,#eef4ff_52%,#f8fbff_100%)]`}
    >
      <AuthHeader showSignIn />
      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        <section className="relative z-10 w-full max-w-xl rounded-3xl border border-(--border) bg-white/88 p-9 text-center shadow-[0_26px_60px_-36px_rgba(39,77,136,0.4)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-(--text-muted) [font-family:var(--font-ui)]">
            Secure Session
          </p>
          <h1 className="mt-3 text-4xl text-(--text-primary) [font-family:var(--font-title)]">
            Ready to sign out?
          </h1>
          <p className="mt-4 text-sm text-(--text-secondary) [font-family:var(--font-ui)]">
            This will close your admin session on this device.
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-8 rounded-2xl bg-linear-to-r from-[#5578b0] to-[#355f9f] px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:brightness-105 [font-family:var(--font-ui)]"
          >
            Sign out now
          </button>
        </section>
      </div>
    </main>
  );
}