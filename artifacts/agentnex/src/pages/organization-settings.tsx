import { useState } from "react";
import { useLocation } from "wouter";
import { Archive, Crown, Lock, PenLine } from "lucide-react";
import type { Organization } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrgFrame } from "@/components/org/org-frame";
import { ConfirmDialog, OrgForm, Panel, LogoUnavailable } from "@/components/org/org-ui";
import { useArchiveOrg, useOrgMembers, useTransferOwnership, useUpdateOrg, isManager } from "@/hooks/use-organizations";
import { errorMessage } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/lib/meta";

function OwnerZone({ org }: { org: Organization }) {
  const members = useOrgMembers(org.id);
  const transfer = useTransferOwnership();
  const archive = useArchiveOrg();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [target, setTarget] = useState("");
  const [tOpen, setTOpen] = useState(false);
  const [aOpen, setAOpen] = useState(false);
  const candidates = (members.data ?? []).filter((m) => m.role !== "owner");
  const targetName = candidates.find((m) => m.userId === target)?.displayName;

  return (
    <>
      <Panel title="Transfer ownership" icon={Crown}>
        <p className="text-sm text-muted-foreground">Hand full control to an existing member. You become an admin. This is the only way an owner steps down.</p>
        {candidates.length === 0 && !members.isLoading ? (
          <p className="mt-4 text-sm italic text-muted-foreground">Invite at least one other member before transferring ownership.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>New owner</Label>
              <Select value={target || undefined} onValueChange={setTarget} disabled={members.isLoading}>
                <SelectTrigger className="mt-1.5" data-testid="select-transfer-target"><SelectValue placeholder={members.isLoading ? "Loading members" : "Choose a member"} /></SelectTrigger>
                <SelectContent>{candidates.map((m) => <SelectItem key={m.userId} value={m.userId}>{m.displayName} ({m.role})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button variant="outline" disabled={!target} onClick={() => setTOpen(true)} data-testid="button-transfer-open">Transfer</Button>
          </div>
        )}
      </Panel>

      <Panel title="Archive organization" icon={Archive} tone="danger">
        <p className="text-sm text-muted-foreground">Archiving removes it from every member's workspace. Records are preserved, not deleted.</p>
        <Button variant="destructive" className="mt-4" onClick={() => setAOpen(true)} data-testid="button-archive-open">Archive organization</Button>
      </Panel>

      <ConfirmDialog open={tOpen} onOpenChange={setTOpen} testId="transfer" title="Transfer ownership" requireText={org.name} confirmLabel="Transfer ownership" pending={transfer.isPending}
        description={<p><span className="font-semibold text-foreground">{targetName}</span> becomes the owner of {org.name}. You will be an admin and cannot undo this yourself.</p>}
        onConfirm={(typed) => transfer.mutate({ organizationId: org.id, data: { userId: target, confirmation: typed } }, {
          onSuccess: () => { setTOpen(false); setTarget(""); toast({ title: "Ownership transferred", description: `${targetName} is now the owner.` }); },
          onError: (e) => toast({ title: "Transfer failed", description: errorMessage(e), variant: "destructive" }),
        })} />
      <ConfirmDialog open={aOpen} onOpenChange={setAOpen} testId="archive" title={`Archive ${org.name}?`} requireText={org.name} confirmLabel="Archive" pending={archive.isPending}
        description={<p>All members lose access. Membership and audit records are kept.</p>}
        onConfirm={(typed) => archive.mutate({ organizationId: org.id, data: { confirmation: typed } }, {
          onSuccess: () => { setAOpen(false); toast({ title: "Organization archived" }); setLocation("/organizations"); },
          onError: (e) => toast({ title: "Archive failed", description: errorMessage(e), variant: "destructive" }),
        })} />
    </>
  );
}

function Body({ org }: { org: Organization }) {
  const update = useUpdateOrg();
  const { toast } = useToast();
  if (!isManager(org.role)) {
    return (
      <div className="space-y-5">
        <Panel title="Settings restricted" icon={Lock}>
          <p className="text-sm text-muted-foreground" data-testid="status-settings-restricted">Only owners and admins can edit this organization. Your role is {org.role}.</p>
        </Panel>
        <LogoUnavailable />
      </div>
    );
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Panel title="Organization details" icon={PenLine}>
        <OrgForm key={org.updatedAt} initial={org} submitLabel="Save changes" pending={update.isPending}
          onSubmit={(data) => update.mutate({ organizationId: org.id, data }, {
            onSuccess: () => toast({ title: "Changes saved" }),
            onError: (e) => toast({ title: "Changes not saved", description: errorMessage(e), variant: "destructive" }),
          })} />
      </Panel>
      <div className="space-y-5">
        {org.role === "owner" ? <OwnerZone org={org} /> : (
          <Panel title="Owner controls" icon={Lock}><p className="text-sm text-muted-foreground">Ownership transfer and archiving are available to the owner only.</p></Panel>
        )}
      </div>
    </div>
  );
}

export default function OrganizationSettingsPage() {
  usePageMeta("Organization settings", "Edit organization details, transfer ownership or archive.");
  return <OrgFrame section="Settings">{(org) => <Body org={org} />}</OrgFrame>;
}
