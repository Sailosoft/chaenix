import Link from "next/link";
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

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  return (
    <main
      className={`${titleFont.variable} ${uiFont.variable} relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_15%,#fb718533_0%,transparent_35%),radial-gradient(circle_at_90%_75%,#22d3ee33_0%,transparent_40%),linear-gradient(130deg,#0f172a_0%,#111827_35%,#1e1b4b_100%)] px-6 py-10`}
    >
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between rounded-3xl border border-white/15 bg-white/10 px-6 py-4 backdrop-blur-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 [font-family:var(--font-ui)]">
              Yuyukyu Admin
            </p>
            <h1 className="mt-1 text-2xl text-white [font-family:var(--font-title)]">
              Control Deck
            </h1>
          </div>
          <Link
            href="/auth/signout"
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-white/15 [font-family:var(--font-ui)]"
          >
            Sign out
          </Link>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-cyan-100/20 bg-cyan-300/10 p-6 backdrop-blur-xl md:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/90 [font-family:var(--font-ui)]">
              Session
            </p>
            <h2 className="mt-3 text-3xl text-white [font-family:var(--font-title)]">
              Welcome, {session.user?.name ?? "Admin"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-100/80 [font-family:var(--font-ui)]">
              You are authenticated with static admin credentials. This area is
              protected by proxy-level route guarding and a server-side session
              check.
            </p>
          </article>

          <article className="rounded-3xl border border-amber-100/20 bg-amber-300/10 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100 [font-family:var(--font-ui)]">
              Account
            </p>
            <p className="mt-3 break-all text-sm text-amber-50/90 [font-family:var(--font-ui)]">
              {session.user?.email}
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}