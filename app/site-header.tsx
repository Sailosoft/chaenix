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
  const homeHref = isAdminRoute ? "/admin/home" : "/";
  const homeActivePath = isAdminRoute ? "/admin/home" : "/";

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { href: homeHref, activePath: homeActivePath, label: "Home" },
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

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        isAdminRoute
          ? "border-slate-700/50 bg-slate-950/85"
          : "border-slate-200/70 bg-white/80"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isAdminRoute
            ? "bg-[radial-gradient(circle_at_10%_10%,#06b6d426_0%,transparent_30%),radial-gradient(circle_at_90%_80%,#fb718526_0%,transparent_32%)]"
            : "bg-[radial-gradient(circle_at_5%_10%,#fb718522_0%,transparent_28%),radial-gradient(circle_at_95%_100%,#06b6d422_0%,transparent_30%)]"
        }`}
      />

      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href={homeHref} className="group inline-flex items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-[0_10px_28px_-14px_rgba(14,165,233,0.8)] transition-transform duration-300 group-hover:scale-105 ${
              isAdminRoute
                ? "bg-gradient-to-br from-cyan-300 via-sky-300 to-blue-300 text-slate-900"
                : "bg-gradient-to-br from-amber-300 via-rose-300 to-cyan-300 text-slate-900"
            }`}
          >
            VC
          </span>
          <div className="leading-tight">
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                isAdminRoute ? "text-slate-300" : "text-slate-500"
              }`}
            >
              Velyx Coffee
            </p>
            <p
              className={`text-lg font-semibold ${
                isAdminRoute ? "text-slate-100" : "text-slate-900"
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
                      ? "bg-white text-slate-900"
                      : "bg-slate-900 text-white"
                    : isSignOut
                      ? isAdminRoute
                        ? "text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                        : "text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      : isAdminRoute
                        ? "text-slate-200 hover:bg-white/10 hover:text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
                isAdminRoute ? "bg-white/10" : "bg-slate-200"
              }`}
            />
          ) : isAuthenticated ? (
            <Link
              href="/auth/signout"
              className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                isAdminRoute
                  ? "border-rose-300/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              Sign out
            </Link>
          ) : (
            <Link
              href="/auth/signin?callbackUrl=/admin"
              className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isAdminRoute
                  ? "bg-white text-slate-900 hover:bg-slate-100"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_14px_32px_-16px_rgba(14,116,144,0.9)] hover:brightness-105"
              }`}
            >
              Sign in to Admin
            </Link>
          )}
        </div>
      </div>

      <nav
        className={`relative flex gap-2 overflow-x-auto border-t px-4 py-2 md:hidden ${
          isAdminRoute ? "border-slate-700/50" : "border-slate-200/70"
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
                    ? "bg-white text-slate-900"
                    : "bg-slate-900 text-white"
                  : isSignOut
                    ? isAdminRoute
                      ? "bg-rose-500/15 text-rose-200"
                      : "bg-rose-50 text-rose-700"
                    : isAdminRoute
                      ? "bg-white/10 text-slate-200"
                      : "bg-slate-100 text-slate-700"
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