"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function toSafeRelativeUrl(value: string) {
  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsedUrl = new URL(value);
    const relativeUrl = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    return relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`;
  } catch {
    return "/admin";
  }
}

export function SignInCard({ callbackUrl, error }: SignInCardProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const safeCallbackUrl = useMemo(
    () => toSafeRelativeUrl(callbackUrl),
    [callbackUrl],
  );

  const humanError = useMemo(() => {
    const errorCode = submitError ?? error;

    if (!errorCode) {
      return null;
    }

    return errorLabels[errorCode] ?? "Unable to sign in. Please try again.";
  }, [error, submitError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(undefined);

    const result = await signIn("credentials", {
      username,
      password,
      callbackUrl: safeCallbackUrl,
      redirect: false,
    });

    if (result?.ok && !result.error) {
      router.replace(safeCallbackUrl);
      router.refresh();
      return;
    }

    setSubmitError(result?.error ?? "CredentialsSignin");

    setIsSubmitting(false);
  }

  return (
    <section className="relative z-10 w-full max-w-md rounded-3xl border border-sky-100/80 bg-white/85 p-8 shadow-[0_26px_60px_-32px_rgba(56,189,248,0.45)] backdrop-blur-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-sky-700 [font-family:var(--font-ui)]">
        Admin Console
      </p>
      <h1 className="text-4xl font-semibold leading-tight text-slate-900 [font-family:var(--font-title)]">
        Welcome back.
      </h1>
      <p className="mt-2 text-sm text-slate-600 [font-family:var(--font-ui)]">
        Sign in with your static admin credentials.
      </p>

      {humanError ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 [font-family:var(--font-ui)]">
          {humanError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-sky-700 [font-family:var(--font-ui)]">
            Username
          </span>
          <input
            required
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none [font-family:var(--font-ui)]"
            placeholder="admin"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-sky-700 [font-family:var(--font-ui)]">
            Password
          </span>
          <input
            required
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none [font-family:var(--font-ui)]"
            placeholder="••••••••"
          />
        </label>

        <button
          disabled={isSubmitting}
          className="group flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-80 [font-family:var(--font-ui)]"
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}