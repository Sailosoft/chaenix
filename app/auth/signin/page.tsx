import { Playfair_Display, Space_Grotesk } from "next/font/google";

import { AuthHeader } from "../auth-header";
import { SignInCard } from "./sign-in-card";

const titleFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-title",
  weight: ["600", "700"],
});

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "700"],
});

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl, error } = await searchParams;

  return (
    <main
      className={`${titleFont.variable} ${uiFont.variable} relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_15%_20%,#7dd3fc55_0%,transparent_48%),radial-gradient(circle_at_85%_10%,#93c5fd66_0%,transparent_42%),linear-gradient(145deg,#f8fbff_0%,#e0f2fe_48%,#eff6ff_100%)]`}
    >
      <AuthHeader />
      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />

        <SignInCard callbackUrl={callbackUrl ?? "/admin"} error={error} />
      </div>
    </main>
  );
}