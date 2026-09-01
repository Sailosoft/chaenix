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
    <main className={`${titleFont.variable} ${uiFont.variable} px-1 py-1`}>
      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-3xl border border-[var(--border)] bg-white/85 p-6 shadow-[0_18px_40px_-30px_rgba(39,77,136,0.45)] backdrop-blur-xl md:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] [font-family:var(--font-ui)]">
            Session
          </p>
          <h2 className="mt-3 text-3xl text-[var(--text-primary)] [font-family:var(--font-title)]">
            Welcome, {session.user?.name ?? "Admin"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)] [font-family:var(--font-ui)]">
            You are authenticated with static admin credentials. This area is
            protected by proxy-level route guarding and a server-side session
            check.
          </p>
        </article>

        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)]/80 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] [font-family:var(--font-ui)]">
            Account
          </p>
          <p className="mt-3 break-all text-sm text-[var(--text-secondary)] [font-family:var(--font-ui)]">
            {session.user?.email}
          </p>
        </article>
      </section>
    </main>
  );
}