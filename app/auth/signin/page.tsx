import { Playfair_Display, Space_Grotesk } from "next/font/google";

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
      className={`${titleFont.variable} ${uiFont.variable} relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_15%_20%,#f59e0b33_0%,transparent_45%),radial-gradient(circle_at_85%_10%,#0ea5e933_0%,transparent_40%),linear-gradient(145deg,#04111d_0%,#12243a_45%,#071423_100%)] px-6 py-16`}
    >
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

      <SignInCard callbackUrl={callbackUrl ?? "/admin"} error={error} />
    </main>
  );
}