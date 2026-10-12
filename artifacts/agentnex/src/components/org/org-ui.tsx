import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Building2, Check, ChevronsUpDown, Loader2, UserRound, ImageOff } from "lucide-react";
import type { Organization, OrganizationInput, OrganizationInputType, OrganizationRole } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COUNTRIES } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useWorkspace, useSelectWs } from "@/hooks/use-organizations";
import { errorMessage } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";

export const ORG_TYPES: { value: OrganizationInputType; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "startup", label: "Startup" },
  { value: "agency", label: "Agency" },
  { value: "enterprise", label: "Enterprise" },
  { value: "other", label: "Other" },
];
export const typeLabel = (t: string) => ORG_TYPES.find((x) => x.value === t)?.label ?? t;

const ROLE_STYLE: Record<OrganizationRole, string> = {
  owner: "border-ember/40 bg-ember/12 text-ember",
  admin: "border-primary/40 bg-primary/12 text-primary",
  member: "border-cyan/40 bg-cyan/10 text-cyan",
  viewer: "border-border bg-muted text-muted-foreground",
};
export function RoleBadge({ role, testId }: { role: OrganizationRole; testId?: string }) {
  return <span data-testid={testId} className={cn("inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", ROLE_STYLE[role])}>{role}</span>;
}

export function OrgMark({ name, className }: { name: string; className?: string }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "O";
  return <span className={cn("inline-flex shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 to-cyan/10 font-display font-semibold text-primary", className ?? "h-10 w-10 text-sm")} aria-hidden>{ini}</span>;
}

export const fmtDate = (s: string) => new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
export const fmtDateTime = (s: string) => new Date(s).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function OrgTabs({ org }: { org: Organization }) {
  const [location] = useLocation();
  const base = `/organizations/${org.id}`;
  const tabs = [
    { href: base, label: "Overview", id: "overview" },
    { href: `${base}/team`, label: "Team", id: "team" },
    { href: `${base}/settings`, label: "Settings", id: "settings" },
  ];
  return (
    <nav aria-label="Organization sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((t) => {
        const active = location === t.href;
        return (
          <Link key={t.id} href={t.href} data-testid={`tab-org-${t.id}`} aria-current={active ? "page" : undefined}
            className={cn("relative whitespace-nowrap px-3 pb-3 pt-1 text-sm font-medium transition-colors", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
            {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden />}
          </Link>
        );
      })}
    </nav>
  );
}

export function Panel({ title, icon: Icon, action, children, className, tone }: { title: string; icon?: typeof Building2; action?: ReactNode; children: ReactNode; className?: string; tone?: "danger" }) {
  return (
    <section className={cn("surface rounded-2xl p-5 sm:p-6", tone === "danger" && "border-destructive/40", className)}>
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className={cn("h-4 w-4", tone === "danger" ? "text-destructive" : "text-cyan")} aria-hidden />}
        <h2 className="text-sm font-semibold">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function LogoUnavailable() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground" data-testid="status-logo-unavailable">
      <ImageOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p><span className="font-semibold text-foreground">Logo upload unavailable.</span> File storage is not configured for this workspace, so organizations display initials instead.</p>
    </div>
  );
}

type FormState = { name: string; type: OrganizationInputType; country: string; website: string; description: string };

export function OrgForm({ initial, submitLabel, pending, onSubmit, onCancel }: {
  initial?: Partial<Organization>; submitLabel: string; pending: boolean; onSubmit: (data: OrganizationInput) => void; onCancel?: () => void;
}) {
  const [f, setF] = useState<FormState>({
    name: initial?.name ?? "", type: (initial?.type as OrganizationInputType) ?? "business", country: initial?.country ?? "",
    website: initial?.website ?? "", description: initial?.description ?? "",
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const countries = f.country && !COUNTRIES.includes(f.country) ? [f.country, ...COUNTRIES] : COUNTRIES;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const e2: Record<string, string> = {};
    const name = f.name.trim();
    if (name.length < 2 || name.length > 100) e2.name = "Use 2 to 100 characters.";
    if (!f.country) e2.country = "Select a country.";
    const web = f.website.trim();
    if (web && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(web)) e2.website = "Use a full URL starting with https://";
    if (f.description.length > 2000) e2.description = "Keep it under 2000 characters.";
    setErr(e2);
    if (Object.keys(e2).length) return;
    onSubmit({ name, type: f.type, country: f.country, website: web, description: f.description.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input id="org-name" className="mt-1.5" value={f.name} maxLength={100} onChange={(e) => set("name", e.target.value)} placeholder="Halden Freight Partners" data-testid="input-org-name" aria-invalid={!!err.name} />
          {err.name && <p className="mt-1 text-xs text-destructive">{err.name}</p>}
        </div>
        <div>
          <Label>Type</Label>
          <Select value={f.type} onValueChange={(v) => set("type", v as OrganizationInputType)}>
            <SelectTrigger className="mt-1.5" data-testid="select-org-type"><SelectValue /></SelectTrigger>
            <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Country</Label>
          <Select value={f.country} onValueChange={(v) => set("country", v)}>
            <SelectTrigger className="mt-1.5" data-testid="select-org-country" aria-invalid={!!err.country}><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          {err.country && <p className="mt-1 text-xs text-destructive">{err.country}</p>}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="org-web">Website <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="org-web" className="mt-1.5" value={f.website} maxLength={300} onChange={(e) => set("website", e.target.value)} placeholder="https://" data-testid="input-org-website" />
          {err.website && <p className="mt-1 text-xs text-destructive">{err.website}</p>}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="org-desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea id="org-desc" className="mt-1.5 min-h-28" value={f.description} maxLength={2000} onChange={(e) => set("description", e.target.value)} placeholder="What does this organization do, and who is it for?" data-testid="input-org-description" />
          <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">{f.description.length}/2000</p>
        </div>
      </div>
      <LogoUnavailable />
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} data-testid="button-org-cancel">Cancel</Button>}
        <Button type="submit" disabled={pending} data-testid="button-org-submit">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}{submitLabel}</Button>
      </div>
    </form>
  );
}

/** Confirmation dialog; when `requireText` is set, the user must type it exactly. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, requireText, pending, onConfirm, children, testId }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: ReactNode; confirmLabel: string;
  requireText?: string; pending?: boolean; onConfirm: (typed: string) => void; children?: ReactNode; testId: string;
}) {
  const [typed, setTyped] = useState("");
  const ok = !requireText || typed === requireText;
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) setTyped(""); onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild><div className="space-y-2 text-sm text-muted-foreground">{description}</div></AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {requireText && (
          <div>
            <Label htmlFor={`${testId}-confirm`} className="text-xs">Type <span className="font-mono font-semibold text-foreground">{requireText}</span> to confirm</Label>
            <Input id={`${testId}-confirm`} className="mt-1.5" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" data-testid={`input-${testId}-confirm`} />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`button-${testId}-cancel`}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!ok || pending} onClick={() => onConfirm(typed)} data-testid={`button-${testId}-confirm`}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}{confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Persisted context switcher. Context is a preference only; it never grants permission. */
export function WorkspaceSwitcher({ compact }: { compact?: boolean }) {
  const ws = useWorkspace();
  const select = useSelectWs();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const orgs = ws.data?.organizations ?? [];
  const current = orgs.find((o) => o.id === ws.data?.selectedOrganizationId) ?? null;

  const choose = (id: string | null) => {
    if (select.isPending || id === (ws.data?.selectedOrganizationId ?? null)) return;
    select.mutate({ data: { organizationId: id } }, {
      onSuccess: () => toast({ title: id ? "Organization context selected" : "Personal context selected" }),
      onError: (e) => toast({ title: "Context not changed", description: errorMessage(e), variant: "destructive" }),
    });
  };

  if (ws.isLoading) return <span className="hidden h-9 w-40 animate-pulse rounded-full bg-muted sm:block" aria-label="Loading workspace" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" data-testid="button-workspace-switcher" aria-label="Switch workspace context"
          className="flex h-9 max-w-[220px] items-center gap-2 rounded-full border border-border bg-card/60 pl-1 pr-2.5 text-xs font-semibold hover:border-primary/50">
          {current ? <OrgMark name={current.name} className="h-7 w-7 rounded-full text-[10px]" /> : <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"><UserRound className="h-3.5 w-3.5" aria-hidden /></span>}
          {!compact && <span className="hidden truncate sm:inline" data-testid="text-workspace-current">{current ? current.name : "Personal"}</span>}
          {select.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden /> : <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="font-mono text-[10px] font-normal uppercase tracking-widest text-muted-foreground">Working context</DropdownMenuLabel>
        {ws.isError && <p className="px-2 py-1.5 text-xs text-destructive">Workspace did not load. <button type="button" className="underline" onClick={() => ws.refetch()}>Retry</button></p>}
        <DropdownMenuItem onSelect={() => choose(null)} data-testid="menu-workspace-personal">
          <UserRound className="mr-2 h-4 w-4" aria-hidden /><span className="flex-1">Personal</span>
          {!current && <Check className="h-4 w-4 text-primary" aria-hidden />}
        </DropdownMenuItem>
        {orgs.map((o) => (
          <DropdownMenuItem key={o.id} onSelect={() => choose(o.id)} data-testid={`menu-workspace-${o.id}`}>
            <OrgMark name={o.name} className="mr-2 h-5 w-5 rounded-md text-[9px]" />
            <span className="flex-1 truncate">{o.name}</span>
            <span className="ml-2 font-mono text-[9px] uppercase text-muted-foreground">{o.role}</span>
            {current?.id === o.id && <Check className="ml-1 h-4 w-4 text-primary" aria-hidden />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setLocation("/organizations")} data-testid="menu-workspace-manage"><Building2 className="mr-2 h-4 w-4" aria-hidden />All organizations</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
