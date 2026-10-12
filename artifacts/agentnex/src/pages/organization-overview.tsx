import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, ArrowRight, Check, FileText, LogOut, MailPlus, ShieldCheck, Users } from "lucide-react";
import type { Organization } from "@workspace/api-client-react";
import { EmptyState } from "@/components/app/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OrgFrame } from "@/components/org/org-frame";
import { ConfirmDialog, Panel, RoleBadge, fmtDate, fmtDateTime } from "@/components/org/org-ui";
import { useOrgAudit, useOrgMembers, useWorkspace, useSelectWs, useLeaveOrg, isManager } from "@/hooks/use-organizations";
import { errorMessage } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/lib/meta";

const label = (a: string) => a.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function Stat({ k, v, testId, accent }: { k: string; v: React.ReactNode; testId: string; accent?: boolean }) {
  return (
    <div className="surface rounded-2xl p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p>
      <p className={accent ? "mt-2 font-display text-2xl font-semibold text-ember" : "mt-2 font-display text-2xl font-semibold"} data-testid={testId}>{v}</p>
    </div>
  );
}

function Body({ org }: { org: Organization }) {
  const mgr = isManager(org.role);
  const members = useOrgMembers(org.id);
  const audit = useOrgAudit(org.id, mgr);
  const ws = useWorkspace();
  const select = useSelectWs();
  const leave = useLeaveOrg();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const active = ws.data?.selectedOrganizationId === org.id;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat k="Members" v={org.memberCount} testId="text-member-count" />
        {mgr ? <Stat k="Pending invites" v={org.pendingInvitationCount} testId="text-pending-count" accent={org.pendingInvitationCount > 0} /> : <Stat k="Your role" v={<RoleBadge role={org.role} />} testId="text-your-role" />}
        <Stat k="Created" v={<span className="text-base">{fmtDate(org.createdAt)}</span>} testId="text-org-created" />
        <Stat k="Updated" v={<span className="text-base">{fmtDate(org.updatedAt)}</span>} testId="text-org-updated" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="About" icon={FileText}>
          {org.description ? <p className="whitespace-pre-line text-sm leading-relaxed" data-testid="text-org-description">{org.description}</p> : <p className="text-sm italic text-muted-foreground">No description yet.{mgr && " Add one in Settings."}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {active ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/12 px-3 py-1.5 text-xs font-semibold text-cyan" data-testid="status-org-active"><Check className="h-3.5 w-3.5" aria-hidden />Active working context</span>
            ) : (
              <Button size="sm" variant="outline" disabled={select.isPending} data-testid="button-set-context"
                onClick={() => select.mutate({ data: { organizationId: org.id } }, { onSuccess: () => toast({ title: "Context set to " + org.name }), onError: (e) => toast({ title: "Context not changed", description: errorMessage(e), variant: "destructive" }) })}>
                Use as working context
              </Button>
            )}
            <span className="text-xs text-muted-foreground">Context is a preference; permissions always follow your role.</span>
            {org.role !== "owner" && (
              <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => setLeaveOpen(true)} data-testid="button-leave-org"><LogOut className="mr-1.5 h-4 w-4" aria-hidden />Leave</Button>
            )}
          </div>
        </Panel>

        <Panel title="Team" icon={Users} action={<Link href={`/organizations/${org.id}/team`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" data-testid="link-view-team">{mgr ? "Manage" : "View all"} <ArrowRight className="h-3 w-3" aria-hidden /></Link>}>
          {members.isLoading ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-9" />)}</div>
            : members.isError ? <p className="text-sm text-destructive">Members did not load. <button type="button" className="underline" onClick={() => members.refetch()}>Retry</button></p>
            : (
              <ul className="divide-y divide-border">
                {(members.data ?? []).slice(0, 6).map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted font-display text-[11px] font-semibold">{m.displayName.slice(0, 2).toUpperCase()}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{m.displayName}</span>
                    <RoleBadge role={m.role} />
                  </li>
                ))}
              </ul>
            )}
          {mgr && <Link href={`/organizations/${org.id}/team`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary" data-testid="link-invite-shortcut"><MailPlus className="h-3.5 w-3.5" aria-hidden />Create an invitation link</Link>}
        </Panel>
      </div>

      {mgr ? (
        <Panel title="Audit log" icon={Activity} action={<span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Owners and admins</span>}>
          {audit.isLoading ? <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
            : audit.isError ? <p className="text-sm text-destructive">Audit log did not load. <button type="button" className="underline" onClick={() => audit.refetch()} data-testid="button-retry-audit">Retry</button></p>
            : !audit.data?.length ? <EmptyState icon={<Activity className="h-5 w-5" aria-hidden />} title="No recorded events" />
            : (
              <ol className="relative space-y-0 border-l border-border pl-5" data-testid="list-audit">
                {audit.data.map((e) => (
                  <li key={e.id} className="relative pb-4 last:pb-0" data-testid={`row-audit-${e.id}`}>
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-background" aria-hidden />
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-medium">{label(e.action)}</span>
                      <span className="text-xs text-muted-foreground">by {e.actorName}</span>
                      <time className="ml-auto font-mono text-[10px] text-muted-foreground" dateTime={e.createdAt}>{fmtDateTime(e.createdAt)}</time>
                    </div>
                    {Object.keys(e.metadata).length > 0 && (
                      <p className="mt-1 flex flex-wrap gap-1.5">{Object.entries(e.metadata).map(([k, v]) => <span key={k} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{k}: {v}</span>)}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
        </Panel>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-cyan" aria-hidden />
          As a {org.role}, you can see the team. Invitations, audit records and settings are restricted to owners and admins.
        </div>
      )}

      <ConfirmDialog open={leaveOpen} onOpenChange={setLeaveOpen} testId="leave-org" title={`Leave ${org.name}?`} confirmLabel="Leave organization" pending={leave.isPending}
        description={<p>You lose access immediately. An owner or admin would need to invite you again.</p>}
        onConfirm={() => leave.mutate({ organizationId: org.id }, {
          onSuccess: () => { setLeaveOpen(false); toast({ title: "You left " + org.name }); setLocation("/organizations"); },
          onError: (e) => toast({ title: "Could not leave", description: errorMessage(e), variant: "destructive" }),
        })} />
    </div>
  );
}

export default function OrganizationOverviewPage() {
  usePageMeta("Organization", "Organization overview, team and activity.");
  return <OrgFrame section="Overview">{(org) => <Body org={org} />}</OrgFrame>;
}
