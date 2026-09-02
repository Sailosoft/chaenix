"use client";

import { FormEvent, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { Lock, User, Loader2, AlertCircle } from "lucide-react";

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

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.ok && !result.error) {
        window.location.href = safeCallbackUrl;
        return;
      }

      setSubmitError(result?.error ?? "CredentialsSignin");
    } catch {
      setSubmitError("CredentialsSignin");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl shadow-[#355f9f]/[0.08] sm:p-10">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#355f9f] to-[#274d88]" />

      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#355f9f]/[0.08] ring-1 ring-[#355f9f]/10">
        <Lock className="h-5 w-5 text-[#355f9f]" strokeWidth={1.8} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#355f9f]">
        Admin Console
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Sign in with your admin credentials to continue.
      </p>

      {humanError ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
          {humanError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-700">
            Username
          </span>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <input
              required
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-200 focus:border-[#355f9f]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#355f9f]/10"
              placeholder="admin"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-700">
            Password
          </span>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <input
              required
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-200 focus:border-[#355f9f]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#355f9f]/10"
              placeholder="••••••••"
            />
          </div>
        </label>

        <button
          disabled={isSubmitting}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#355f9f] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#355f9f]/25 transition-all duration-200 hover:bg-[#274d88] hover:shadow-[#355f9f]/40 disabled:cursor-not-allowed disabled:opacity-80"
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </section>
  );
}
