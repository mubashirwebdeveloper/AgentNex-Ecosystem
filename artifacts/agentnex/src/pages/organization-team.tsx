import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Copy, Link2, Loader2, LogOut, MailPlus, Timer, UserMinus, Users, X } from "lucide-react";
import type { InvitationCreated, Organization, OrganizationMember } from "@workspace/api-client-react";
import { EmptyState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrgFrame } from "@/components/org/org-frame";
import { ConfirmDialog, Panel, RoleBadge, fmtDate } from "@/components/org/org-ui";
import {
  useOrgMembers, useOrgInvitations, useChangeRole, useRemoveMember, useInviteMember, useRevokeInvite, useLeaveOrg,
  isManager, canActOn, assignableRoles, inviteLink,
} from "@/hooks/use-organizations";
import { useMe, errorMessage } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/lib/meta";

type InvRole = "admin" | "member" | "viewer";

function InviteForm({ org, onCreated }: { org: Organization; onCreated: (c: InvitationCreated) => void }) {
  const invite = useInviteMember();
  const { toast } = useToast();
  const roles = assignableRoles(org.role);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvRole>("member");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 254) { setErr("Enter a valid email address."); return; }
    setErr("");
    invite.mutate({ organizationId: org.id, data: { email: v, role } }, {
      onSuccess: (c) => { setEmail(""); setRole("member"); onCreated(c); },
      onError: (e2) => { setErr(errorMessage(e2)); toast({ title: "Invitation not created", description: errorMessage(e2), variant: "destructive" }); },
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div>
        <Label htmlFor="inv-email">Email</Label>
        <Input id="inv-email" type="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" data-testid="input-invite-email" aria-invalid={!!err} />
      </div>
      <div>
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as InvRole)}>
          <SelectTrigger className="mt-1.5" data-testid="select-invite-role"><SelectValue /></SelectTrigger>
          <SelectContent>{roles.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {err && <p className="text-xs text-destructive" data-testid="text-invite-error">{err}</p>}
      <Button type="submit" className="w-full" disabled={invite.isPending} data-testid="button-invite-submit">
        {invite.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Link2 className="mr-2 h-4 w-4" aria-hidden />}Create invitation link
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">No email is sent. Email delivery is not configured, so you share the link yourself. It is shown only once.</p>
    </form>
  );
}

function CreatedLink({ created, onDismiss }: { created: InvitationCreated; onDismiss: () => void }) {
  const { toast } = useToast();
  const url = inviteLink(created.token);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); }
    catch { toast({ title: "Copy failed", description: "Select the link and copy it manually.", variant: "destructive" }); }
  };
  return (
    <div className="rounded-2xl border border-ember/40 bg-ember/8 p-4" data-testid="panel-invite-link" role="status">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-semibold">Manual invitation link for {created.invitation.email}</p>
        <button type="button" onClick={onDismiss} aria-label="Dismiss link" className="text-muted-foreground hover:text-foreground" data-testid="button-dismiss-link"><X className="h-4 w-4" aria-hidden /></button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Copy it now. For security the token cannot be shown again; revoke and re-invite if lost. Expires {fmtDate(created.invitation.expiresAt)}.</p>
      <div className="mt-3 flex gap-2">
        <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" data-testid="input-invite-link" />
        <Button type="button" onClick={copy} data-testid="button-copy-link"><Copy className="mr-1.5 h-4 w-4" aria-hidden />Copy</Button>
      </div>
    </div>
  );
}

function Body({ org }: { org: Organization }) {
  const mgr = isManager(org.role);
  const members = useOrgMembers(org.id);
  const invites = useOrgInvitations(org.id, mgr);
  const changeRole = useChangeRole();
  const remove = useRemoveMember();
  const revoke = useRevokeInvite();
  const leave = useLeaveOrg();
  const me = useMe();
  const { user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [created, setCreated] = useState<InvitationCreated | null>(null);
  const [removing, setRemoving] = useState<OrganizationMember | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [busyRole, setBusyRole] = useState<string | null>(null);
  const isSelf = (m: OrganizationMember) => m.userId === me.data?.id || m.userId === user?.id;
  const pending = (invites.data ?? []).filter((i) => i.status === "pending");

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <Panel title="Members" icon={Users} action={<span className="font-mono text-xs text-muted-foreground" data-testid="text-team-count">{members.data?.length ?? org.memberCount}</span>}>
        {members.isLoading ? <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          : members.isError ? <p className="text-sm text-destructive">Members did not load. <button type="button" className="underline" onClick={() => members.refetch()} data-testid="button-retry-members">Retry</button></p>
          : !members.data?.length ? <EmptyState icon={<Users className="h-5 w-5" aria-hidden />} title="No members found" />
          : (
            <ul className="divide-y divide-border">
              {members.data.map((m) => {
                const self = isSelf(m);
                const editable = !self && canActOn(org.role, m.role);
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 py-3" data-testid={`row-member-${m.userId}`}>
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-display text-xs font-semibold">{m.displayName.slice(0, 2).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.displayName}{self && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}</p>
                      <p className="text-xs text-muted-foreground">Joined {fmtDate(m.joinedAt)}</p>
                    </div>
                    {editable ? (
                      <Select value={m.role} disabled={busyRole === m.userId}
                        onValueChange={(v) => {
                          setBusyRole(m.userId);
                          changeRole.mutate({ organizationId: org.id, userId: m.userId, data: { role: v as InvRole } }, {
                            onSuccess: () => toast({ title: "Role updated", description: `${m.displayName} is now ${v}.` }),
                            onError: (e) => toast({ title: "Role not changed", description: errorMessage(e), variant: "destructive" }),
                            onSettled: () => setBusyRole(null),
                          });
                        }}>
                        <SelectTrigger className="h-8 w-[110px] text-xs capitalize" data-testid={`select-role-${m.userId}`} aria-label={`Role for ${m.displayName}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{assignableRoles(org.role).map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : <RoleBadge role={m.role} testId={`text-role-${m.userId}`} />}
                    {editable && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setRemoving(m)} aria-label={`Remove ${m.displayName}`} data-testid={`button-remove-${m.userId}`}><UserMinus className="h-4 w-4" aria-hidden /></Button>
                    )}
                    {self && m.role !== "owner" && (
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setLeaveOpen(true)} data-testid="button-leave-team"><LogOut className="mr-1 h-4 w-4" aria-hidden />Leave</Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
      </Panel>

      <div className="space-y-5">
        {mgr ? (
          <>
            {created && <CreatedLink created={created} onDismiss={() => setCreated(null)} />}
            <Panel title="Invite a teammate" icon={MailPlus}><InviteForm org={org} onCreated={setCreated} /></Panel>
            <Panel title="Pending invitations" icon={Timer} action={<span className="font-mono text-xs text-ember">{pending.length}</span>}>
              {invites.isLoading ? <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>
                : invites.isError ? <p className="text-sm text-destructive">Invitations did not load. <button type="button" className="underline" onClick={() => invites.refetch()} data-testid="button-retry-invites">Retry</button></p>
                : pending.length === 0 ? <p className="text-sm text-muted-foreground" data-testid="status-invites-empty">No pending invitations.</p>
                : (
                  <ul className="space-y-2">
                    {pending.map((i) => (
                      <li key={i.id} className="flex items-center gap-2 rounded-xl border border-border bg-background/40 p-2.5" data-testid={`row-invite-${i.id}`}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{i.email}</p>
                          <p className="text-[11px] text-muted-foreground"><span className="capitalize">{i.role}</span> · expires {fmtDate(i.expiresAt)}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={revoke.isPending && revoke.variables?.invitationId === i.id} data-testid={`button-revoke-${i.id}`}
                          onClick={() => revoke.mutate({ organizationId: org.id, invitationId: i.id }, {
                            onSuccess: () => toast({ title: "Invitation revoked", description: i.email }),
                            onError: (e) => toast({ title: "Not revoked", description: errorMessage(e), variant: "destructive" }),
                          })}>Revoke</Button>
                      </li>
                    ))}
                  </ul>
                )}
            </Panel>
          </>
        ) : (
          <Panel title="Team access" icon={Users}><p className="text-sm text-muted-foreground">Only owners and admins can invite or change roles.</p></Panel>
        )}
      </div>

      <ConfirmDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)} testId="remove-member" title={`Remove ${removing?.displayName ?? "member"}?`} confirmLabel="Remove member" pending={remove.isPending}
        description={<p>They lose access to {org.name} immediately. Their history stays in the audit log.</p>}
        onConfirm={() => removing && remove.mutate({ organizationId: org.id, userId: removing.userId }, {
          onSuccess: () => { toast({ title: "Member removed", description: removing.displayName }); setRemoving(null); },
          onError: (e) => toast({ title: "Not removed", description: errorMessage(e), variant: "destructive" }),
        })} />
      <ConfirmDialog open={leaveOpen} onOpenChange={setLeaveOpen} testId="leave-team" title={`Leave ${org.name}?`} confirmLabel="Leave organization" pending={leave.isPending}
        description={<p>You lose access immediately and need a new invitation to return.</p>}
        onConfirm={() => leave.mutate({ organizationId: org.id }, {
          onSuccess: () => { setLeaveOpen(false); toast({ title: "You left " + org.name }); setLocation("/organizations"); },
          onError: (e) => toast({ title: "Could not leave", description: errorMessage(e), variant: "destructive" }),
        })} />
    </div>
  );
}

export default function OrganizationTeamPage() {
  usePageMeta("Team", "Organization members, roles and invitations.");
  return <OrgFrame section="Team">{(org) => <Body org={org} />}</OrgFrame>;
}
