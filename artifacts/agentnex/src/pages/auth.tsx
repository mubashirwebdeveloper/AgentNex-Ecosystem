import type { ReactNode } from "react";
import { SignIn, SignUp } from "@clerk/react";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, Fingerprint, KeyRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { usePageMeta } from "@/lib/meta";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthLayout({ children, title, line }: { children: ReactNode; title: string; line: string }) {
  return (
    <div className="noise grid min-h-[100dvh] bg-background lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-card/40 p-10 lg:flex lg:flex-col">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <Link href="/" className="relative" aria-label="AGENTNEX home"><Logo /></Link>
        <div className="relative my-auto">
          <div className="relative mx-auto w-full max-w-[400px]" aria-hidden>
            <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-primary/25 via-transparent to-cyan/15 blur-2xl" />
            <div className="surface relative rotate-[-3deg] rounded-2xl p-5 opacity-60"><div className="h-2 w-24 rounded bg-muted" /><div className="mt-3 h-2 w-40 rounded bg-muted" /></div>
            <div className="surface relative -mt-10 ml-6 rounded-2xl border-cyan/30 p-5 shadow-[0_24px_60px_-24px_hsl(var(--primary)/0.8)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan text-primary-foreground"><Fingerprint className="h-5 w-5" /></span>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Identity record</p><p className="text-sm font-semibold">Owned by you</p></div>
              </div>
              <div className="mt-5 space-y-2.5">
                {["Account", "Profile", "Preferences"].map((t, i) => (
                  <div key={t} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
                    <span>{t}</span><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Step {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <h2 className="mt-12 text-3xl font-semibold leading-tight">{title}</h2>
          <p className="mt-3 max-w-md text-muted-foreground">{line}</p>
          <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
            <li className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-cyan" aria-hidden />An identity you own and control</li>
            <li className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-cyan" aria-hidden />Secure sessions and provider-managed recovery</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan" aria-hidden />No organization required to get started</li>
          </ul>
        </div>
      </aside>
      <main id="main" className="flex min-w-0 flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-home"><ArrowLeft className="h-4 w-4" aria-hidden />Back</Link>
          <span className="lg:hidden"><Logo compact /></span>
        </div>
        <div className="flex w-full min-w-0 flex-1 items-center justify-center py-10">{children}</div>
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
