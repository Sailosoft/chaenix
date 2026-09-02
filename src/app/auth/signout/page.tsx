"use client";

import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

import { AuthHeader } from "../auth-header";

const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export default function SignOutPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ redirect: false });
    router.replace("/auth/signin?callbackUrl=/admin");
    router.refresh();
  }

  return (
    <main
      className={`${interFont.variable} relative flex min-h-screen flex-col overflow-hidden bg-white font-[family-name:var(--font-inter)]`}
    >
      <AuthHeader showSignIn />
      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#355f9f]/[0.06] blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-[#355f9f]/[0.05] blur-[100px]" />

        <section className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-8 text-center shadow-xl shadow-[#355f9f]/[0.08] sm:p-10">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#355f9f] to-[#274d88]" />

          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#355f9f]/[0.08] ring-1 ring-[#355f9f]/10">
            <LogOut className="h-6 w-6 text-[#355f9f]" strokeWidth={1.8} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#355f9f]">
            Secure Session
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Ready to sign out?
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This will close your admin session on this device.
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#355f9f] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#355f9f]/25 transition-all duration-200 hover:bg-[#274d88] hover:shadow-[#355f9f]/40 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              "Sign out now"
            )}
          </button>
        </section>
      </div>
    </main>
  );
}
