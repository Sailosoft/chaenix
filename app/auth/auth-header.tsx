import Link from "next/link";

type AuthHeaderProps = {
  showSignIn?: boolean;
};

export function AuthHeader({ showSignIn = false }: AuthHeaderProps) {
  return (
    <header className="relative z-20 border-b border-sky-200/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-300 via-sky-300 to-blue-300 text-sm font-bold text-slate-900 shadow-[0_10px_28px_-14px_rgba(14,165,233,0.8)] transition-transform duration-300 group-hover:scale-105">
            CA
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700/80">
              Chaeni App
            </p>
            <p className="text-lg font-semibold text-slate-900">Operations Suite</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Home
          </Link>
          <Link
            href={showSignIn ? "/auth/signin?callbackUrl=/admin" : "/admin"}
            className="inline-flex items-center rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_32px_-16px_rgba(14,116,144,0.9)] transition hover:brightness-105"
          >
            {showSignIn ? "Sign in" : "Admin"}
          </Link>
        </nav>
      </div>
    </header>
  );
}