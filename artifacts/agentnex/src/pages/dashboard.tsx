import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Circle, Compass, LayoutGrid, Settings, UserRound, Globe2, ListChecks, Loader2, Building2, Bot, Inbox,
} from "lucide-react";
import type { Widgets } from "@workspace/api-client-react";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, EmptyState } from "@/components/app/states";
import { CATEGORIES } from "@/components/globe/network-globe";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe, useDashboardData, useSavePreferences, errorMessage } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-organizations";
import { OrgMark, RoleBadge } from "@/components/org/org-ui";
import { ACCOUNT_TYPES, LANGUAGES } from "@/lib/nav";
import { usePageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

const WIDGETS: { key: keyof Widgets; label: string; desc: string; icon: typeof UserRound }[] = [
  { key: "account", label: "Account", desc: "Your saved profile details", icon: UserRound },
  { key: "checklist", label: "Getting started", desc: "Setup checklist and progress", icon: ListChecks },
  { key: "network", label: "Network concept", desc: "Roadmap of ecosystem participants", icon: Globe2 },
];

function Ring({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = 42, c = 2 * Math.PI * r;
  const reduce = useReducedMotion();
  return (
    <div className="relative h-28 w-28 shrink-0" role="img" aria-label={`Profile ${v}% complete`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" stroke="url(#ring-g)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * v) / 100 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs><linearGradient id="ring-g" x1="0" x2="1"><stop offset="0" stopColor="hsl(var(--primary))" /><stop offset="1" stopColor="hsl(var(--cyan))" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold" data-testid="text-profile-completion">{v}%</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">profile</span>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, action, children, className }: { title: string; icon: typeof UserRound; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("surface rounded-2xl p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan" aria-hidden />
        <h2 className="text-sm font-semibold">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  usePageMeta("Overview", "Your AGENTNEX workspace: onboarding progress, profile completion and next steps.");
  const me = useMe();
  const dash = useDashboardData();
  const save = useSavePreferences();
  const { toast } = useToast();
  const { user } = useUser();
  const [pending, setPending] = useState<Widgets | null>(null);

  if (me.isLoading || dash.isLoading) {
    return (
      <div data-testid="status-dashboard-loading">
        <Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-9 w-72" />
        <Skeleton className="mt-8 h-36 w-full rounded-2xl" />
        <div className="mt-5 grid gap-5 lg:grid-cols-3"><Skeleton className="h-72 rounded-2xl lg:col-span-2" /><Skeleton className="h-72 rounded-2xl" /></div>
      </div>
    );
  }
  if (me.isError || dash.isError || !me.data || !dash.data) {
    return <ErrorState title="Your dashboard did not load" onRetry={() => { me.refetch(); dash.refetch(); }} />;
  }

  const p = me.data;
  const d = dash.data;
  const widgets = pending ?? p.widgets;
  const name = p.displayName || user?.firstName || "there";
  const done = d.checklist.filter((c) => c.completed).length;
  const visibleCount = Object.values(widgets).filter(Boolean).length;

  const toggleWidget = (key: keyof Widgets, value: boolean) => {
    if (save.isPending) return;
    const nextW: Widgets = { ...widgets, [key]: value };
    setPending(nextW);
    save.mutate(
      { data: { widgets: nextW } },
      {
        onSuccess: () => setPending(null),
        onError: (err) => { setPending(null); toast({ title: "Layout not saved", description: errorMessage(err), variant: "destructive" }); },
      },
    );
  };

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Overview" }]}
        title={<>{greeting()}, <span className="text-gradient">{name}</span></>}
        description={`Member since ${new Date(p.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}. Your personal profile and preferences are available in every workspace.`}
        actions={
          <>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold hover:border-primary/50" data-testid="button-customize-widgets">
                  <LayoutGrid className="h-4 w-4" aria-hidden />Customize
                  {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="Saving" />}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <p className="text-sm font-semibold">Dashboard widgets</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Saved to your account and restored on every device.</p>
                <div className="mt-4 space-y-3">
                  {WIDGETS.map((w) => (
                    <label key={w.key} className="flex cursor-pointer items-center gap-3">
                      <w.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <span className="flex-1"><span className="block text-sm font-medium">{w.label}</span><span className="block text-xs text-muted-foreground">{w.desc}</span></span>
                      <Switch checked={widgets[w.key]} disabled={save.isPending} onCheckedChange={(v) => toggleWidget(w.key, v)} data-testid={`switch-widget-${w.key}`} aria-label={`Show ${w.label} widget`} />
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Link href="/settings" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold hover:border-primary/50" data-testid="link-settings-shortcut"><Settings className="h-4 w-4" aria-hidden />Settings</Link>
          </>
        }
      />

      {!p.onboardingCompleted && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-5 overflow-hidden rounded-2xl border border-ember/40 bg-gradient-to-r from-ember/15 via-card to-card p-5 sm:p-6" data-testid="banner-resume-onboarding">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ember/20 text-ember"><Compass className="h-5 w-5" aria-hidden /></span>
            <div className="flex-1">
              <h2 className="font-semibold">{p.onboardingStep > 0 ? `Resume onboarding: step ${Math.min(p.onboardingStep + 1, 3)} of 3` : "Finish setting up your identity"}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.onboardingStep} of 3 steps saved. Your answers are kept, so you can continue right where you stopped.</p>
              <div className="mt-3 flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className={cn("h-1.5 w-10 rounded-full", i < p.onboardingStep ? "bg-ember" : "bg-muted")} />)}</div>
            </div>
            <Link href="/onboarding" className="group inline-flex items-center gap-2 self-start rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-[hsl(226_55%_6%)] sm:self-center" data-testid="link-resume-onboarding">
              {p.onboardingStep > 0 ? "Resume" : "Start"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </motion.section>
      )}

      <section className="surface mb-5 flex flex-col gap-6 rounded-2xl p-5 sm:flex-row sm:items-center sm:p-6">
        <Ring value={d.profileCompletion} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{d.profileCompletion >= 100 ? "Your profile is complete" : "Strengthen your profile"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Completion is calculated from the fields saved to your account. {done} of {d.checklist.length} checklist items done.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/profile" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground" data-testid="link-edit-profile">Edit profile <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
            <Link href="/onboarding" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-xs font-semibold hover:border-primary/50">Review onboarding</Link>
          </div>
        </div>
      </section>

      {visibleCount === 0 ? (
        <div className="surface rounded-2xl">
          <EmptyState icon={<LayoutGrid className="h-5 w-5" aria-hidden />} title="All widgets are hidden">Use Customize to bring back the account, checklist or network panels.</EmptyState>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {widgets.checklist && (
            <Card title="Getting started" icon={ListChecks} className={cn(widgets.network ? "lg:col-span-1" : "lg:col-span-2")} action={<span className="font-mono text-xs text-muted-foreground">{done}/{d.checklist.length}</span>}>
              {d.checklist.length === 0 ? (
                <EmptyState icon={<ListChecks className="h-5 w-5" aria-hidden />} title="Nothing to do yet" />
              ) : (
                <ul className="space-y-1">
                  {d.checklist.map((c) => (
                    <li key={c.id}>
                      <Link href={c.href} className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60" data-testid={`link-checklist-${c.id}`}>
                        {c.completed ? <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan" aria-hidden /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />}
                        <span className={cn("flex-1 text-sm", c.completed && "text-muted-foreground line-through decoration-muted-foreground/50")}>{c.label}</span>
                        <span className="sr-only">{c.completed ? "completed" : "not completed"}</span>
                        {!c.completed && <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {widgets.network && (
            <Card title="Ecosystem roadmap" icon={Globe2} className={cn(widgets.checklist && widgets.account ? "lg:col-span-1" : "lg:col-span-2", "lg:row-span-2")}>
              <p className="text-xs text-muted-foreground">Participant types planned for AGENTNEX. Your personal identity is the live layer today.</p>
              <ul className="mt-4 space-y-1.5">
                {CATEGORIES.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/40 px-3 py-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/12 text-cyan"><c.icon className="h-3.5 w-3.5" aria-hidden /></span>
                    <span className="flex-1 text-sm">{c.label}</span>
                    <span className={cn("font-mono text-[9px] uppercase tracking-widest", c.id === "humans" ? "text-cyan" : "text-ember")}>{c.id === "humans" ? "Live" : "Planned"}</span>
                  </li>
                ))}
              </ul>
              <Link href="/network" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline" data-testid="link-dashboard-network">Open network concept <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
            </Card>
          )}

          {widgets.account && (
            <Card title="Account" icon={UserRound} className={cn(!widgets.network && !widgets.checklist ? "lg:col-span-3" : "lg:col-span-1")} action={<Link href="/profile" className="text-xs font-semibold text-primary hover:underline">Edit</Link>}>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                {[
                  ["Display name", p.displayName],
                  ["Account type", ACCOUNT_TYPES.find((a) => a.value === p.accountType)?.label],
                  ["Country", p.country],
                  ["Timezone", p.timezone?.replace(/_/g, " ")],
                  ["Language", LANGUAGES.find((l) => l.value === p.language)?.label],
                  ["Email", user?.primaryEmailAddress?.emailAddress],
                ].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
                    <dd className={cn("mt-1 truncate", !v && "text-muted-foreground italic")} data-testid={`text-account-${String(k).toLowerCase().replace(/\s/g, "-")}`}>{v || "Not set"}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      )}

      <WorkspaceCard />

      <section className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="surface rounded-2xl">
          <EmptyState icon={<Inbox className="h-5 w-5" aria-hidden />} title="No activity yet">Connections, agents and workflow activity will appear here once those modules launch. Nothing is simulated.</EmptyState>
        </div>
        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Next steps</h2>
          <ul className="mt-4 space-y-3">
            {[
              { href: p.onboardingCompleted ? "/profile" : "/onboarding", icon: Compass, t: p.onboardingCompleted ? "Add a professional description" : "Complete onboarding", d: "A complete profile carries into every future module." },
              { href: "/organizations", icon: Building2, t: "Organizations", d: "Create a team, invite members and manage roles." },
              { href: "/agents", icon: Bot, t: "Learn about AI Agents", d: "How Agent Passports will work." },
            ].map((x) => (
              <li key={x.t}>
                <Link href={x.href} className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">
                  <x.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex-1"><span className="block text-sm font-medium">{x.t}</span><span className="block text-xs text-muted-foreground">{x.d}</span></span>
                  <ArrowRight className="mt-0.5 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function WorkspaceCard() {
  const ws = useWorkspace();
  if (ws.isLoading) return <Skeleton className="mt-5 h-28 rounded-2xl" />;
  if (ws.isError || !ws.data) {
    return <div className="mt-5"><ErrorState title="Workspace context did not load" onRetry={() => ws.refetch()} /></div>;
  }
  const { organizations, selectedOrganizationId } = ws.data;
  const current = organizations.find((o) => o.id === selectedOrganizationId);
  return (
    <section className="surface mt-5 rounded-2xl p-5 sm:p-6" data-testid="card-workspace">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-cyan" aria-hidden />
        <h2 className="text-sm font-semibold">Organizations</h2>
        <span className="ml-2 text-xs text-muted-foreground" data-testid="text-workspace-context">Context: {current ? current.name : "Personal"}</span>
        <Link href={organizations.length ? "/organizations" : "/organizations/new"} className="ml-auto text-xs font-semibold text-primary hover:underline" data-testid="link-dashboard-orgs">{organizations.length ? "View all" : "Create one"}</Link>
      </div>
      {organizations.length === 0 ? (
        <p className="text-sm text-muted-foreground">You are working in your personal context. Create an organization when you need a team with roles.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.slice(0, 6).map((o) => (
            <li key={o.id}>
              <Link href={`/organizations/${o.id}`} className={cn("flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/50", o.id === selectedOrganizationId ? "border-cyan/50 bg-cyan/5" : "border-border bg-background/40")} data-testid={`link-dashboard-org-${o.id}`}>
                <OrgMark name={o.name} className="h-9 w-9 text-xs" />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{o.name}</span><span className="block text-xs text-muted-foreground">{o.memberCount} {o.memberCount === 1 ? "member" : "members"}</span></span>
                <RoleBadge role={o.role} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
