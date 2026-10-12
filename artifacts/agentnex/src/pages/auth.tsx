import type { ReactNode } from "react";
import { SignIn, SignUp } from "@clerk/react";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, Fingerprint, KeyRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NetworkGlobe } from "@/components/globe/network-globe";
import { usePageMeta } from "@/lib/meta";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthLayout({ children, title, line }: { children: ReactNode; title: string; line: string }) {
  return (
    <div className="noise grid min-h-[100dvh] bg-background lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-card/40 p-10 lg:flex lg:flex-col">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <Link href="/" className="relative" aria-label="AGENTNEX home"><Logo /></Link>
        <div className="relative my-auto">
          <div className="pointer-events-none mx-auto aspect-square w-full max-w-[420px] opacity-90" aria-hidden>
            <NetworkGlobe selected={null} onSelect={() => {}} className="h-full w-full" showLabels={false} />
          </div>
          <h2 className="mt-6 text-3xl font-semibold leading-tight">{title}</h2>
          <p className="mt-3 max-w-md text-muted-foreground">{line}</p>
          <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
            <li className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-cyan" aria-hidden />An identity you own and control</li>
            <li className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-cyan" aria-hidden />Secure sessions and provider-managed recovery</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan" aria-hidden />No organization required to get started</li>
          </ul>
        </div>
      </aside>
      <main id="main" className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-home"><ArrowLeft className="h-4 w-4" aria-hidden />Back</Link>
          <span className="lg:hidden"><Logo compact /></span>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </main>
    </div>
  );
}

export function SignInPage() {
  usePageMeta("Log in", "Log in to your AGENTNEX account to manage your identity, profile and preferences.");
  return (
    <AuthLayout title="Welcome back to the network." line="Pick up where you left off. Your onboarding progress and preferences are saved to your account.">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/dashboard`} />
    </AuthLayout>
  );
}

export function SignUpPage() {
  usePageMeta("Create your account", "Create a free AGENTNEX account and set up your global identity in three steps.");
  return (
    <AuthLayout title="Your identity is the first node." line="Create an account, then set up your profile in three short steps. You can pause and resume at any time.">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/onboarding`} />
    </AuthLayout>
  );
}
