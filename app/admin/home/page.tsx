import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Playfair_Display, Space_Grotesk } from "next/font/google";

import { authOptions } from "@/lib/auth";

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

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/home");
  }

  return (
    <main className={`${titleFont.variable} ${uiFont.variable} px-1 py-1`}>
      <section className="rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 [font-family:var(--font-ui)]">
          Admin Home
        </p>
        <h1 className="mt-3 text-4xl text-white [font-family:var(--font-title)]">
          Welcome to Chaeni App Control Center
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-100/80 [font-family:var(--font-ui)]">
          Centralized entry point for operational insights, service health, and
          administrative actions.
        </p>
      </section>
    </main>
  );
}