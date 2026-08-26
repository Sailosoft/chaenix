"use client";

import { FormEvent, useMemo, useState } from "react";
import { signIn } from "next-auth/react";

type SignInCardProps = {
  callbackUrl: string;
  error?: string;
};

const errorLabels: Record<string, string> = {
  CredentialsSignin: "Invalid username or password.",
  AccessDenied: "Access denied.",
  Configuration: "Auth configuration issue. Check server env.",
};

export function SignInCard({ callbackUrl, error }: SignInCardProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const humanError = useMemo(() => {
    if (!error) {
      return null;
    }

    return errorLabels[error] ?? "Unable to sign in. Please try again.";
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    await signIn("credentials", {
      username,
      password,
      callbackUrl,
      redirect: true,
    });

    setIsSubmitting(false);
  }

  return (
    <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_30px_80px_-32px_rgba(2,132,199,0.6)] backdrop-blur-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-100 [font-family:var(--font-ui)]">
        Admin Console
      </p>
      <h1 className="text-4xl font-semibold leading-tight text-white [font-family:var(--font-title)]">
        Welcome back.
      </h1>
      <p className="mt-2 text-sm text-cyan-50/80 [font-family:var(--font-ui)]">
        Sign in with your static admin credentials.
      </p>

      {humanError ? (
        <div className="mt-6 rounded-2xl border border-rose-200/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100 [font-family:var(--font-ui)]">
          {humanError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-100 [font-family:var(--font-ui)]">
            Username
          </span>
          <input
            required
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            className="w-full rounded-2xl border border-white/20 bg-black/20 px-4 py-3 text-white placeholder:text-slate-300/60 focus:border-cyan-300 focus:outline-none [font-family:var(--font-ui)]"
            placeholder="admin"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-100 [font-family:var(--font-ui)]">
            Password
          </span>
          <input
            required
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="w-full rounded-2xl border border-white/20 bg-black/20 px-4 py-3 text-white placeholder:text-slate-300/60 focus:border-amber-300 focus:outline-none [font-family:var(--font-ui)]"
            placeholder="••••••••"
          />
        </label>

        <button
          disabled={isSubmitting}
          className="group flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-300 via-orange-300 to-cyan-300 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-80 [font-family:var(--font-ui)]"
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}