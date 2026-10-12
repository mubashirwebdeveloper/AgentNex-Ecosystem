import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, UserRound, PenLine, PartyPopper } from "lucide-react";
import type { Profile, ProfileInput, ProfileInputAccountType, ProfileInputLanguage } from "@workspace/api-client-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/app/theme-sync";
import { SearchSelect } from "@/components/app/search-select";
import { AccountTypePicker, LanguageSelect, LANGUAGE_NOTE } from "@/components/app/profile-fields";
import { ErrorState } from "@/components/app/states";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe, useSaveProfile, errorMessage } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES, TIMEZONES, detectedTimezone } from "@/lib/nav";
import { usePageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

const STEPS = [
  { t: "Identity", d: "How you appear on AGENTNEX", icon: UserRound },
  { t: "Location", d: "Where and when you work", icon: MapPin },
  { t: "About you", d: "An optional professional note", icon: PenLine },
];

type Draft = { displayName: string; accountType: ProfileInputAccountType; country: string; timezone: string; language: ProfileInputLanguage; description: string };

function fromProfile(p: Profile): Draft {
  return {
    displayName: p.displayName ?? "",
    accountType: p.accountType ?? "individual",
    country: p.country ?? "",
    timezone: p.timezone || detectedTimezone(),
    language: p.language ?? "en",
    description: p.description ?? "",
  };
}

export default function Onboarding() {
  usePageMeta("Set up your identity", "Complete your AGENTNEX onboarding in three steps. Progress is saved after every step.");
  const me = useMe();
  const save = useSaveProfile();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dir, setDir] = useState(1);
  const initFor = useRef<string | null>(null);

  useEffect(() => {
    if (me.data && initFor.current !== me.data.id) {
      initFor.current = me.data.id;
      setDraft(fromProfile(me.data));
      setStep(me.data.onboardingCompleted ? 0 : Math.min(me.data.onboardingStep, 2));
    }
  }, [me.data]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (i: number) => {
    if (!draft) return false;
    const e: Record<string, string> = {};
    if (i === 0 && !draft.displayName.trim()) e.displayName = "Add a display name to continue.";
    if (i === 0 && draft.displayName.length > 80) e.displayName = "Keep it under 80 characters.";
    if (i === 1 && !draft.country) e.country = "Choose your country.";
    if (i === 1 && !draft.timezone) e.timezone = "Choose your timezone.";
    if (i === 2 && draft.description.length > 1000) e.description = "Keep it under 1000 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const payload = (): ProfileInput => ({
    displayName: draft!.displayName.trim(),
    accountType: draft!.accountType,
    country: draft!.country,
    timezone: draft!.timezone,
    language: draft!.language,
    description: draft!.description.trim(),
  });

  const next = () => {
    if (!draft || !me.data || !validate(step)) return;
    const isLast = step === 2;
    if (isLast && (!draft.displayName.trim() || !draft.country || !draft.timezone)) {
      toast({ title: "A few details are missing", description: "Display name, country and timezone are required to finish.", variant: "destructive" });
      setStep(!draft.displayName.trim() ? 0 : 1);
      return;
    }
    const data: ProfileInput = isLast
      ? { ...payload(), onboardingStep: 3, onboardingCompleted: true }
      : { ...payload(), onboardingStep: Math.max(me.data.onboardingStep, step + 1) };
    save.mutate(
      { data },
      {
        onSuccess: () => {
          if (isLast) {
            toast({ title: "Onboarding complete", description: "Your identity is set up. Welcome to AGENTNEX." });
            setLocation("/dashboard");
          } else {
            setDir(1);
            setStep(step + 1);
          }
        },
        onError: (err) => toast({ title: "Could not save this step", description: errorMessage(err), variant: "destructive" }),
      },
    );
  };

  const saveAndExit = () => {
    if (!draft) return;
    save.mutate(
      { data: payload() },
      {
        onSuccess: () => { toast({ title: "Progress saved", description: "You can resume onboarding from your dashboard." }); setLocation("/dashboard"); },
        onError: (err) => toast({ title: "Could not save", description: errorMessage(err), variant: "destructive" }),
      },
    );
  };

  const back = () => { setDir(-1); setStep((s) => Math.max(0, s - 1)); };
  const completedSteps = me.data?.onboardingCompleted ? 3 : me.data?.onboardingStep ?? 0;

  return (
    <div className="noise relative min-h-[100dvh] overflow-x-clip bg-background">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[800px] max-w-full -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" aria-hidden />
      <header className="relative mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" aria-label="Go to dashboard"><Logo /></Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/dashboard" className="rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground" data-testid="link-skip-onboarding">Skip for now</Link>
        </div>
      </header>

      <main id="main" className="relative mx-auto grid max-w-5xl gap-8 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Onboarding steps">
          <p className="eyebrow">Setup · {Math.min(completedSteps, 3)} of 3 saved</p>
          <ol className="mt-4 flex gap-2 lg:flex-col lg:gap-1">
            {STEPS.map((s, i) => {
              const done = i < completedSteps;
              const current = i === step;
              return (
                <li key={s.t} className="flex-1 lg:flex-none">
                  <button
                    type="button"
                    disabled={!draft || i > completedSteps}
                    onClick={() => { setDir(i > step ? 1 : -1); setStep(i); }}
                    aria-current={current ? "step" : undefined}
                    data-testid={`button-step-${i + 1}`}
                    className={cn("flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50", current ? "bg-card" : "hover:bg-card/60")}
                  >
                    <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors", done ? "border-cyan bg-cyan/15 text-cyan" : current ? "border-primary text-primary" : "border-border text-muted-foreground")}>
                      {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                    </span>
                    <span className="hidden min-w-0 sm:block">
                      <span className="block text-sm font-semibold">{s.t}</span>
                      <span className="block truncate text-xs text-muted-foreground">{s.d}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted lg:hidden" aria-hidden>
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-transform duration-500" style={{ width: "100%", transform: `translateX(-${100 - ((step + 1) / 3) * 100}%)` }} />
          </div>
        </nav>

        <section className="surface overflow-hidden rounded-3xl p-6 sm:p-8" aria-live="polite">
          {me.isLoading || (!draft && !me.isError) ? (
            <div className="space-y-4" data-testid="status-onboarding-loading">
              <Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="mt-6 h-11 w-full" /><Skeleton className="h-28 w-full" />
            </div>
          ) : me.isError ? (
            <ErrorState message="We could not load your profile, so onboarding cannot continue yet." onRetry={() => me.refetch()} />
          ) : draft ? (
            <>
              {me.data?.onboardingCompleted && step === 0 && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan/30 bg-cyan/10 p-3 text-sm">
                  <PartyPopper className="h-4 w-4 shrink-0 text-cyan" aria-hidden />
                  Onboarding is complete. You can review and update your answers here at any time.
                </div>
              )}
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={step}
                  custom={dir}
                  initial={reduce ? false : { opacity: 0, x: dir * 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: dir * -28 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="font-mono text-xs text-muted-foreground">Step {step + 1} of 3</p>
                  <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                    {step === 0 && "Who are you on the network?"}
                    {step === 1 && "Where in the world are you?"}
                    {step === 2 && "Tell others what you do."}
                  </h1>

                  {step === 0 && (
                    <div className="mt-6 space-y-6">
                      <div>
                        <Label htmlFor="displayName">Display name</Label>
                        <Input id="displayName" value={draft.displayName} maxLength={80} onChange={(e) => set("displayName", e.target.value)} placeholder="How should people see you?" className="mt-2 h-11 rounded-xl bg-background/60" aria-invalid={!!errors.displayName} aria-describedby="displayName-err" data-testid="input-display-name" autoFocus />
                        {errors.displayName && <p id="displayName-err" className="mt-1.5 text-xs text-destructive">{errors.displayName}</p>}
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium">Account type</p>
                        <AccountTypePicker value={draft.accountType} onChange={(v) => set("accountType", v)} />
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <div className="mt-2"><SearchSelect id="country" value={draft.country} onChange={(v) => set("country", v)} options={COUNTRIES} placeholder="Select country" searchLabel="Search countries" testId="select-country" invalid={!!errors.country} /></div>
                        {errors.country && <p className="mt-1.5 text-xs text-destructive">{errors.country}</p>}
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <div className="mt-2"><SearchSelect id="timezone" value={draft.timezone} onChange={(v) => set("timezone", v)} options={TIMEZONES} placeholder="Select timezone" searchLabel="Search timezones" testId="select-timezone" invalid={!!errors.timezone} /></div>
                        {errors.timezone ? <p className="mt-1.5 text-xs text-destructive">{errors.timezone}</p> : <p className="mt-1.5 text-xs text-muted-foreground">Detected from your browser: {detectedTimezone().replace(/_/g, " ")}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="language">Preferred language</Label>
                        <div className="mt-2"><LanguageSelect id="language" value={draft.language} onChange={(v) => set("language", v)} /></div>
                        <p className="mt-1.5 text-xs text-muted-foreground">{LANGUAGE_NOTE}</p>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="mt-6">
                      <Label htmlFor="description">Professional description <span className="font-normal text-muted-foreground">(optional)</span></Label>
                      <Textarea id="description" value={draft.description} maxLength={1000} onChange={(e) => set("description", e.target.value)} rows={6} placeholder="What you work on, what you are looking for, or how you plan to use AGENTNEX." className="mt-2 rounded-xl bg-background/60" data-testid="input-description" />
                      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground"><span>{errors.description || "Visible only to you in Phase 1."}</span><span className="font-mono">{draft.description.length}/1000</span></div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
                {step > 0 ? (
                  <button type="button" onClick={back} className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="button-back"><ArrowLeft className="h-4 w-4" aria-hidden />Back</button>
                ) : <span />}
                <button type="button" onClick={saveAndExit} disabled={save.isPending} className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary/50 disabled:opacity-60 sm:ml-auto" data-testid="button-save-exit">Save and finish later</button>
                <button type="button" onClick={next} disabled={save.isPending} className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_-10px_hsl(var(--primary)/0.8)] transition-transform hover:-translate-y-px disabled:opacity-70" data-testid="button-continue">
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  {step === 2 ? "Finish setup" : "Save and continue"}
                  {!save.isPending && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
                </button>
              </div>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
