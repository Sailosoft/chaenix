import { Inter } from "next/font/google";

import { AuthHeader } from "../auth-header";
import { SignInCard } from "./sign-in-card";

const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
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
      className={`${interFont.variable} relative flex min-h-screen flex-col overflow-hidden bg-white font-[family-name:var(--font-inter)]`}
    >
      <AuthHeader />
      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#355f9f]/[0.06] blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-[#355f9f]/[0.05] blur-[100px]" />

        <SignInCard callbackUrl={callbackUrl ?? "/admin"} error={error} />
      </div>
    </main>
  );
}
