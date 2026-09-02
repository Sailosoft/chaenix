import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DM_Sans, Inter } from "next/font/google";

import { authOptions } from "@/lib/auth";

import { RecentChats } from "./recent-chats";

const headingFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  return (
    <main className={`${headingFont.variable} ${bodyFont.variable} space-y-5 px-1 py-1`}>
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--brand)] p-8 text-white shadow-[0_8px_40px_-4px_var(--brand)]/30">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-48 w-48 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 h-40 w-40 rounded-full bg-[var(--brand-strong)]/40 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-white/70" />
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/60 [font-family:var(--font-body)]">
              Dashboard
            </p>
          </div>
          <h1 className="mt-3 text-[2.5rem] leading-tight font-semibold tracking-tight text-white [font-family:var(--font-heading)]">
            Welcome back, {session.user?.name ?? "Admin"}
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/60 [font-family:var(--font-body)]">
            Manage your conversations and access administrative tools from your control center.
          </p>

          <Link
            href="/admin/chat"
            className="mt-6 inline-flex items-center gap-2.5 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[var(--brand)] shadow-lg shadow-black/10 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 [font-family:var(--font-body)]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New Chat
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_40px_-4px_rgba(0,0,0,0.06)] md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 [font-family:var(--font-heading)]">
              Recent Chats
            </h2>
            <Link
              href="/admin/history"
              className="text-[13px] font-medium text-neutral-400 hover:text-[var(--brand)] transition-colors [font-family:var(--font-body)]"
            >
              View all
            </Link>
          </div>
          <RecentChats />
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_40px_-4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                <svg
                  className="h-5 w-5 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 [font-family:var(--font-body)]">
                  System Status
                </p>
                <p className="text-[13px] text-emerald-500 [font-family:var(--font-body)]">
                  All systems operational
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_40px_-4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)]">
                <svg
                  className="h-5 w-5 text-[var(--brand)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 [font-family:var(--font-body)]">
                  Account
                </p>
                <p className="text-[13px] text-neutral-400 truncate max-w-[160px] [font-family:var(--font-body)]">
                  {session.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
