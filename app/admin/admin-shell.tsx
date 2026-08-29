"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";

type AdminNavItem = {
  href: string;
  label: string;
};

const adminNavItems: AdminNavItem[] = [
  { href: "/admin/home", label: "Home" },
  { href: "/admin/chat", label: "Chat" },
  { href: "/admin", label: "Dashboard" },
];

function isActivePath(currentPath: string, targetPath: string) {
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export function AdminShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setIsMenuOpen(true);
    }
  }, []);

  const activeLabel = useMemo(() => {
    const activeItem = adminNavItems.find((item) =>
      isActivePath(pathname, item.href),
    );

    return activeItem?.label ?? "Admin";
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_12%_10%,#bfdbfe55_0%,transparent_36%),radial-gradient(circle_at_88%_82%,#a5f3fc66_0%,transparent_40%),linear-gradient(145deg,#eff6ff_0%,#e0f2fe_45%,#f0f9ff_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-sky-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label="Toggle admin menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-slate-700 transition hover:bg-sky-100"
            >
              <span className="grid gap-1.5">
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
              </span>
            </button>

            <Link href="/admin/home" className="group inline-flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-sky-300 to-blue-300 text-sm font-bold text-slate-900 shadow-[0_10px_28px_-14px_rgba(14,165,233,0.8)] transition-transform duration-300 group-hover:scale-105">
                CA
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700/80">
                  Chaeni App
                </p>
                <p className="text-lg font-semibold text-slate-900">Admin Control Deck</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-lg border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 sm:inline-flex">
              {activeLabel}
            </span>
            <Link
              href="/auth/signout"
              className="inline-flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Logout
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 pb-8 pt-6 sm:px-6">
        <aside
          className={`fixed inset-y-0 left-0 z-50 border-r border-sky-200/80 bg-[#f2f9ff]/95 p-5 backdrop-blur-xl transition-all duration-200 lg:relative lg:inset-auto lg:z-auto lg:rounded-3xl lg:border lg:bg-white/75 ${
            isMenuOpen
              ? "w-72 translate-x-0 opacity-100"
              : "w-72 -translate-x-full opacity-100 lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:border-transparent lg:p-0 lg:opacity-0"
          }`}
        >
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Menu
            </p>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs text-slate-700"
            >
              Close
            </button>
          </div>

          <nav className="space-y-2">
            {adminNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-sky-300 text-slate-900"
                      : "text-slate-700 hover:bg-sky-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {isMenuOpen ? (
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-40 bg-sky-950/20 lg:hidden"
          />
        ) : null}

        <div className="relative z-10 flex-1">{children}</div>
      </div>
    </div>
  );
}
