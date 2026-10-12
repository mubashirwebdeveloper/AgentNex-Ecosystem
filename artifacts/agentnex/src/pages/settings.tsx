import { useState, type ReactNode } from "react";
import { useClerk, useUser } from "@clerk/react";
import { Moon, Sun, Languages, Clock, UserRound, LogOut, Check, Loader2, KeyRound } from "lucide-react";
import type { ProfileInput } from "@workspace/api-client-react";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/states";
import { SearchSelect } from "@/components/app/search-select";
import { LanguageSelect, LANGUAGE_NOTE } from "@/components/app/profile-fields";
import { useThemeToggle } from "@/components/app/theme-sync";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMe, useSaveProfile, errorMessage } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";
import { TIMEZONES } from "@/lib/nav";
import { usePageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function Row({ icon: Icon, title, desc, children }: { icon: typeof Sun; title: string; desc: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-b border-border py-6 last:border-0 md:grid-cols-[1fr_1.2fr]">
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden />
        <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{desc}</p></div>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  usePageMeta("Settings", "Manage your AGENTNEX theme, language, timezone and account.");
  const me = useMe();
  const save = useSaveProfile();
  const { theme, apply, pending: themePending } = useThemeToggle();
  const { toast } = useToast();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [savingField, setSavingField] = useState<string | null>(null);

  const saveField = (field: string, data: ProfileInput) => {
    setSavingField(field);
    save.mutate({ data }, {
      onSuccess: () => toast({ title: "Preference saved" }),
      onError: (err) => toast({ title: "Not saved", description: errorMessage(err), variant: "destructive" }),
      onSettled: () => setSavingField(null),
    });
  };

  if (me.isLoading) return <div data-testid="status-settings-loading"><Skeleton className="h-9 w-40" /><Skeleton className="mt-6 h-[420px] rounded-2xl" /></div>;
  if (me.isError || !me.data) return <ErrorState title="Settings did not load" onRetry={() => me.refetch()} />;
  const p = me.data;
  const saving = (f: string) => savingField === f && <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="Saving" />;

  return (
    <div>
      <PageHeader crumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Settings" }]} title="Settings" description="Preferences are saved to your account and follow you across devices." />
      <div className="surface rounded-2xl px-5 sm:px-6">
        <Row icon={theme === "dark" ? Moon : Sun} title="Theme" desc="Dark follows the AGENTNEX night-sky identity. Light is tuned for bright rooms.">
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3">
            {(["dark", "light"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => theme !== t && apply(t)} data-testid={`radio-theme-${t}`}
                className={cn("group relative overflow-hidden rounded-xl border p-3 text-left transition-all", theme === t ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]" : "border-border hover:border-primary/40")}>
                <div className={cn("mb-3 h-14 rounded-lg border", t === "dark" ? "border-white/10 bg-[#0a1230]" : "border-black/10 bg-[#eef3fb]")} aria-hidden>
                  <div className={cn("m-2 h-2 w-10 rounded-full", t === "dark" ? "bg-[#2f7bff]" : "bg-[#1565e6]")} />
                  <div className={cn("mx-2 h-1.5 w-16 rounded-full", t === "dark" ? "bg-white/20" : "bg-black/15")} />
                </div>
                <span className="flex items-center text-sm font-medium capitalize">{t}{theme === t && <Check className="ml-auto h-4 w-4 text-primary" aria-hidden />}</span>
              </button>
            ))}
          </div>
          {themePending && <p className="mt-2 text-xs text-muted-foreground" role="status">Saving theme...</p>}
        </Row>
        <Row icon={Languages} title="Language" desc={LANGUAGE_NOTE}>
          <LanguageSelect value={p.language} onChange={(v) => saveField("language", { language: v })} />
          <p className="mt-1.5 text-xs text-muted-foreground">Saved immediately{saving("language")}</p>
        </Row>
        <Row icon={Clock} title="Timezone" desc="Used to show dates and times in your local context.">
          <SearchSelect value={p.timezone} onChange={(v) => saveField("timezone", { timezone: v })} options={TIMEZONES} placeholder="Select timezone" searchLabel="Search timezones" testId="select-settings-timezone" />
          <p className="mt-1.5 text-xs text-muted-foreground">Saved immediately{saving("timezone")}</p>
        </Row>
        <Row icon={UserRound} title="Account information" desc="Managed by your secure sign-in provider.">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</dt><dd className="mt-1 truncate" data-testid="text-settings-email">{user?.primaryEmailAddress?.emailAddress ?? "Not available"}</dd></div>
            <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Member since</dt><dd className="mt-1">{new Date(p.createdAt).toLocaleDateString()}</dd></div>
            <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Onboarding</dt><dd className="mt-1">{p.onboardingCompleted ? "Complete" : `${p.onboardingStep} of 3 steps`}</dd></div>
            <div><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Organization</dt><dd className="mt-1 text-muted-foreground">None · personal account</dd></div>
          </dl>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Forgot your password? Use the reset option on the login screen. Recovery is handled securely by our authentication provider.</p>
        </Row>
        <Row icon={LogOut} title="Log out" desc="End your session on this device.">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="inline-flex items-center gap-2 rounded-full border border-destructive/50 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10" data-testid="button-logout"><LogOut className="h-4 w-4" aria-hidden />Log out</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out of AGENTNEX?</AlertDialogTitle>
                <AlertDialogDescription>Your profile and preferences stay saved. You can log back in at any time.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-logout">Stay signed in</AlertDialogCancel>
                <AlertDialogAction onClick={() => signOut({ redirectUrl: basePath || "/" })} data-testid="button-confirm-logout">Log out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Row>
      </div>
    </div>
  );
}
