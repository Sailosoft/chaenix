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
  { href: "/admin/history", label: "History" },
  { href: "/admin", label: "Dashboard" },
];

function isActivePath(currentPath: string, targetPath: string) {
  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedTarget = targetPath.replace(/\/+$/, "");

  if (normalizedTarget === "/admin") {
    return normalizedCurrent === "/admin";
  }

  return (
    normalizedCurrent === normalizedTarget ||
    normalizedCurrent.startsWith(`${normalizedTarget}/`)
  );
}

export function AdminShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsMenuOpen(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  const activeLabel = useMemo(() => {
    const activeItem = adminNavItems.find((item) =>
      isActivePath(pathname, item.href),
    );

    return activeItem?.label ?? "Admin";
  }, [pathname]);

  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_12%_10%,rgba(171,195,232,0.35)_0%,transparent_36%),radial-gradient(circle_at_88%_82%,rgba(201,217,242,0.38)_0%,transparent_40%),linear-gradient(145deg,#f7faff_0%,#eef4ff_45%,#f8fbff_100%)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label="Toggle admin menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
            >
              <span className="grid gap-1.5">
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
              </span>
            </button>

            <Link href="/admin/home" className="group inline-flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#d5e4fb] via-[#aac2e7] to-[#7d9fd1] text-sm font-bold text-[var(--text-primary)] shadow-[0_10px_24px_-14px_rgba(39,77,136,0.45)] transition-transform duration-300 group-hover:scale-105">
                CA
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Chaeni App
                </p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">Admin Control Deck</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-lg border border-[var(--border)] bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] sm:inline-flex">
              {activeLabel}
            </span>
            <Link
              href="/auth/signout"
              className="inline-flex items-center rounded-xl border border-[var(--danger-text)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm font-semibold text-[var(--danger-text)] transition hover:brightness-95"
            >
              Logout
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-4 pb-8 pt-6 sm:px-6">
        <aside
          className={`fixed inset-y-0 left-0 z-50 border-r border-[var(--border)] bg-white/95 p-5 backdrop-blur-xl transition-all duration-200 lg:relative lg:inset-auto lg:z-auto lg:rounded-3xl lg:border lg:bg-white/84 ${
            isMenuOpen
              ? "w-72 translate-x-0 opacity-100"
              : "w-72 -translate-x-full opacity-100 lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:border-transparent lg:p-0 lg:opacity-0"
          }`}
        >
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
              Menu
            </p>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--text-secondary)]"
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
                      ? "bg-[var(--brand)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {isMounted && isMenuOpen ? (
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-40 bg-[#102347]/26 lg:hidden"
          />
        ) : null}

        <div className="relative z-10 flex-1">{children}</div>
      </div>
    </div>
  );
}
