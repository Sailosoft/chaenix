import Link from "next/link";

type AuthHeaderProps = {
  showSignIn?: boolean;
};

export function AuthHeader({ showSignIn = false }: AuthHeaderProps) {
  return (
    <header className="relative z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#355f9f] text-sm font-bold text-white shadow-lg shadow-[#355f9f]/25 transition-transform duration-300 group-hover:scale-105">
            CA
          </span>
          <p className="text-sm font-semibold text-slate-900">Chaeni</p>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-[#355f9f]/[0.06] hover:text-[#355f9f]"
          >
            Home
          </Link>
          <Link
            href={showSignIn ? "/auth/signin?callbackUrl=/admin" : "/admin"}
            className="inline-flex items-center rounded-xl bg-[#355f9f] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#355f9f]/25 transition hover:bg-[#274d88] hover:shadow-[#355f9f]/40"
          >
            {showSignIn ? "Sign in" : "Admin"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
