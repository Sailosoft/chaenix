import Link from "next/link";

type ErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16">
      <section className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-8 text-slate-100 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Authentication Error
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Sign-in failed</h1>
        <p className="mt-3 text-sm text-slate-300">
          Something went wrong while authenticating.
        </p>
        {error ? (
          <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Error code: {error}
          </p>
        ) : null}

        <Link
          href="/auth/signin"
          className="mt-7 inline-flex rounded-xl bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}