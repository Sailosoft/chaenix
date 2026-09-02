"use client";

import Link from "next/link";
import { getSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  activePath: string;
  label: string;
};

function isActivePath(currentPath: string, targetPath: string) {
  if (targetPath === "/") {
    return currentPath === "/";
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const isAdminRoute = pathname.startsWith("/admin");
  const isHomeRoute = pathname === "/";
  const homeHref = isAdminRoute ? "/admin" : "/";
  const homeActivePath = isAdminRoute ? "/admin" : "/";

  const homeNavItems = [
    { href: "#home", label: "Home" },
    { href: "#chat", label: "Chat" },
    { href: "#reports", label: "Reports" },
    { href: "#files", label: "Files" },
    { href: "#contact", label: "Contact" },
  ];

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { href: homeHref, activePath: homeActivePath, label: "Home" },
      { href: "/blog", activePath: "/blog", label: "Blog" },
    ];

    if (isAdminRoute || isAuthenticated) {
      items.push({ href: "/admin", activePath: "/admin", label: "Admin" });
    }

    if (isAuthenticated) {
      items.push({ href: "/auth/signout", activePath: "/auth/signout", label: "Sign out" });
    } else {
      items.push({
        href: "/auth/signin?callbackUrl=/admin",
        activePath: "/auth/signin",
        label: "Sign in",
      });
    }

    return items;
  }, [homeActivePath, homeHref, isAdminRoute, isAuthenticated]);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      setIsSessionLoading(true);
      const session = await getSession();

      if (!active) {
        return;
      }

      setIsAuthenticated(Boolean(session));
      setIsSessionLoading(false);
    }

    resolveSession();

    return () => {
      active = false;
    };
  }, [pathname]);

  if (pathname.startsWith("/auth") || pathname.startsWith("/admin")) {
    return null;
  }

  if (isHomeRoute) {
    return (
      <header className="absolute left-0 right-0 top-0 z-40 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-xl border border-(--border) bg-white/92 px-3 py-3 text-(--text-primary) shadow-[0_18px_42px_-26px_rgba(39,77,136,0.35)] sm:px-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--border) bg-(--brand) text-sm font-black text-white">
              C
            </span>
            <div>
              <p className="text-base font-bold leading-none sm:text-lg">Chaeni</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {homeNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs font-semibold uppercase tracking-[0.08em] text-(--text-secondary) transition hover:text-(--text-primary)"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <span className="inline-flex rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-[11px] font-semibold text-(--text-secondary)">
            Made with AI
          </span>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        isAdminRoute
          ? "border-(--border) bg-(--surface)/90"
          : "border-(--border) bg-(--surface)/80"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isAdminRoute
            ? "bg-[radial-gradient(circle_at_8%_10%,rgba(83,124,190,0.24)_0%,transparent_36%),radial-gradient(circle_at_92%_86%,rgba(168,192,233,0.28)_0%,transparent_34%)]"
            : "bg-[radial-gradient(circle_at_5%_10%,rgba(170,195,235,0.24)_0%,transparent_32%),radial-gradient(circle_at_95%_100%,rgba(204,220,245,0.28)_0%,transparent_34%)]"
        }`}
      />

      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href={homeHref} className="group inline-flex items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-[0_10px_26px_-16px_rgba(39,77,136,0.45)] transition-transform duration-300 group-hover:scale-105 ${
              isAdminRoute
                ? "bg-linear-to-br from-[#b7cef0] via-[#94b5e3] to-[#6f93cb] text-[#102347]"
                : "bg-linear-to-br from-[#d8e7fb] via-[#b7cef0] to-[#87acd9] text-[#102347]"
            }`}
          >
            CA
          </span>
          <div className="leading-tight">
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                isAdminRoute ? "text-(--text-muted)" : "text-(--text-muted)"
              }`}
            >
              Chaeni App
            </p>
            <p
              className={`text-lg font-semibold ${
                isAdminRoute ? "text-(--text-primary)" : "text-(--text-primary)"
              }`}
            >
              {isAdminRoute ? "Admin Control Deck" : "Operations Suite"}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.activePath);
            const isSignOut = item.label === "Sign out";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  active
                    ? isAdminRoute
                      ? "bg-(--brand) text-white"
                      : "bg-(--brand) text-white"
                    : isSignOut
                      ? isAdminRoute
                        ? "text-(--danger-text) hover:bg-(--danger-soft) hover:text-(--danger-text)"
                        : "text-(--danger-text) hover:bg-(--danger-soft) hover:text-(--danger-text)"
                      : isAdminRoute
                        ? "text-(--text-secondary) hover:bg-(--surface-soft) hover:text-(--text-primary)"
                        : "text-(--text-secondary) hover:bg-(--surface-soft) hover:text-(--text-primary)"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isSessionLoading ? (
            <span
              className={`h-10 w-32 animate-pulse rounded-xl ${
                isAdminRoute ? "bg-(--surface-soft)" : "bg-(--surface-soft)"
              }`}
            />
          ) : isAuthenticated ? (
            <Link
              href="/auth/signout"
              className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                isAdminRoute
                  ? "border-(--danger-text)/30 bg-(--danger-soft) text-(--danger-text) hover:brightness-95"
                  : "border-(--danger-text)/30 bg-(--danger-soft) text-(--danger-text) hover:brightness-95"
              }`}
            >
              Sign out
            </Link>
          ) : (
            <Link
              href="/auth/signin?callbackUrl=/admin"
              className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isAdminRoute
                  ? "bg-(--brand) text-white hover:bg-(--brand-strong)"
                  : "bg-linear-to-r from-[#5578b0] to-[#355f9f] text-white shadow-[0_14px_28px_-16px_rgba(39,77,136,0.8)] hover:brightness-105"
              }`}
            >
              Sign in to Admin
            </Link>
          )}
        </div>
      </div>

      <nav
        className={`relative flex gap-2 overflow-x-auto border-t px-4 py-2 md:hidden ${
          isAdminRoute ? "border-(--border)" : "border-(--border)"
        }`}
      >
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.activePath);
          const isSignOut = item.label === "Sign out";

          return (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                active
                  ? isAdminRoute
                    ? "bg-(--brand) text-white"
                    : "bg-(--brand) text-white"
                  : isSignOut
                    ? isAdminRoute
                      ? "bg-(--danger-soft) text-(--danger-text)"
                      : "bg-(--danger-soft) text-(--danger-text)"
                    : isAdminRoute
                      ? "bg-(--surface-soft) text-(--text-secondary)"
                      : "bg-(--surface-soft) text-(--text-secondary)"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}