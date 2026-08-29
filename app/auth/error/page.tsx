import Link from "next/link";

import { AuthHeader } from "../auth-header";

type ErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_10%_12%,rgba(171,194,231,0.4)_0%,transparent_42%),linear-gradient(160deg,#f8fbff_0%,#eef4ff_58%,#f8fbff_100%)]">
      <AuthHeader showSignIn />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <section className="w-full max-w-lg rounded-3xl border border-(--border) bg-white/88 p-8 text-(--text-primary) shadow-[0_26px_60px_-36px_rgba(39,77,136,0.42)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)">
            Authentication Error
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Sign-in failed</h1>
          <p className="mt-3 text-sm text-(--text-secondary)">
            Something went wrong while authenticating.
          </p>
          {error ? (
            <p className="mt-5 rounded-xl border border-(--border) bg-(--surface-soft) px-3 py-2 text-xs text-(--text-secondary)">
              Error code: {error}
            </p>
          ) : null}

          <Link
            href="/auth/signin"
            className="mt-7 inline-flex rounded-xl bg-(--brand) px-5 py-2 text-sm font-semibold text-white transition hover:bg-(--brand-strong)"
          >
            Back to sign in
          </Link>
        </section>
      </div>
    </main>
  );
}