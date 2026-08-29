import Link from "next/link";

import { AuthHeader } from "../auth-header";

type ErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_10%_12%,#93c5fd4d_0%,transparent_42%),linear-gradient(160deg,#f8fbff_0%,#e0f2fe_58%,#eff6ff_100%)]">
      <AuthHeader showSignIn />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <section className="w-full max-w-lg rounded-3xl border border-sky-100/80 bg-white/85 p-8 text-slate-900 shadow-[0_26px_60px_-32px_rgba(56,189,248,0.45)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Authentication Error
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Sign-in failed</h1>
          <p className="mt-3 text-sm text-slate-600">
            Something went wrong while authenticating.
          </p>
          {error ? (
            <p className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
              Error code: {error}
            </p>
          ) : null}

          <Link
            href="/auth/signin"
            className="mt-7 inline-flex rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Back to sign in
          </Link>
        </section>
      </div>
    </main>
  );
}