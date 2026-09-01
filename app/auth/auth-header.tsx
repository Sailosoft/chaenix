import Link from "next/link";

type AuthHeaderProps = {
  showSignIn?: boolean;
};

export function AuthHeader({ showSignIn = false }: AuthHeaderProps) {
  return (
    <header className="relative z-20 border-b border-(--border) bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#d5e4fb] via-[#aac2e7] to-[#7d9fd1] text-sm font-bold text-(--text-primary) shadow-[0_10px_24px_-14px_rgba(39,77,136,0.45)] transition-transform duration-300 group-hover:scale-105">
            CA
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-(--text-muted)">
              Chaeni App
            </p>
            <p className="text-lg font-semibold text-(--text-primary)">Operations Suite</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-medium text-(--text-secondary) transition hover:bg-(--surface-soft) hover:text-(--text-primary)"
          >
            Home
          </Link>
          <Link
            href={showSignIn ? "/auth/signin?callbackUrl=/admin" : "/admin"}
            className="inline-flex items-center rounded-xl bg-linear-to-r from-[#5578b0] to-[#355f9f] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(39,77,136,0.75)] transition hover:brightness-105"
          >
            {showSignIn ? "Sign in" : "Admin"}
          </Link>
        </nav>
      </div>
    </header>
  );
}