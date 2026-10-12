import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOrganizations, useGetOrganization, useListOrganizationMembers, useListOrganizationInvitations,
  useListOrganizationAudit, useGetWorkspace, useCreateOrganization, useUpdateOrganization, useChangeOrganizationRole,
  useRemoveOrganizationMember, useInviteOrganizationMember, useRevokeOrganizationInvitation, useLeaveOrganization,
  useTransferOrganizationOwnership, useArchiveOrganization, useAcceptOrganizationInvitation, useSelectWorkspace,
  getListOrganizationsQueryKey, getGetOrganizationQueryKey, getListOrganizationMembersQueryKey,
  getListOrganizationInvitationsQueryKey, getListOrganizationAuditQueryKey, getGetWorkspaceQueryKey,
  type OrganizationRole,
} from "@workspace/api-client-react";

const STALE = 15_000;

function useReady() {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && !!isSignedIn;
}

export function useOrganizations() {
  const ready = useReady();
  return useListOrganizations({ query: { enabled: ready, queryKey: getListOrganizationsQueryKey(), staleTime: STALE } });
}
export function useOrganization(id: string) {
  const ready = useReady();
  return useGetOrganization(id, { query: { enabled: ready && !!id, queryKey: getGetOrganizationQueryKey(id), staleTime: STALE } });
}
export function useOrgMembers(id: string, enabled = true) {
  const ready = useReady();
  return useListOrganizationMembers(id, { query: { enabled: ready && !!id && enabled, queryKey: getListOrganizationMembersQueryKey(id), staleTime: STALE } });
}
/** Only enable for owner/admin — never fetched for members/viewers. */
export function useOrgInvitations(id: string, enabled: boolean) {
  const ready = useReady();
  return useListOrganizationInvitations(id, { query: { enabled: ready && !!id && enabled, queryKey: getListOrganizationInvitationsQueryKey(id), staleTime: STALE } });
}
/** Only enable for owner/admin. */
export function useOrgAudit(id: string, enabled: boolean) {
  const ready = useReady();
  return useListOrganizationAudit(id, { query: { enabled: ready && !!id && enabled, queryKey: getListOrganizationAuditQueryKey(id), staleTime: STALE } });
}
export function useWorkspace() {
  const ready = useReady();
  return useGetWorkspace({ query: { enabled: ready, queryKey: getGetWorkspaceQueryKey(), staleTime: STALE } });
}

function useInvalidateOrgs() {
  const qc = useQueryClient();
  const ws = getGetWorkspaceQueryKey()[0];
  const orgs = getListOrganizationsQueryKey()[0];
  return () =>
    qc.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey[0];
        return typeof k === "string" && (k === ws || k.startsWith(orgs));
      },
    });
}

export function useCreateOrg() { const inv = useInvalidateOrgs(); return useCreateOrganization({ mutation: { onSuccess: inv } }); }
export function useUpdateOrg() { const inv = useInvalidateOrgs(); return useUpdateOrganization({ mutation: { onSuccess: inv } }); }
export function useChangeRole() { const inv = useInvalidateOrgs(); return useChangeOrganizationRole({ mutation: { onSuccess: inv } }); }
export function useRemoveMember() { const inv = useInvalidateOrgs(); return useRemoveOrganizationMember({ mutation: { onSuccess: inv } }); }
export function useInviteMember() { const inv = useInvalidateOrgs(); return useInviteOrganizationMember({ mutation: { onSuccess: inv } }); }
export function useRevokeInvite() { const inv = useInvalidateOrgs(); return useRevokeOrganizationInvitation({ mutation: { onSuccess: inv } }); }
export function useLeaveOrg() { const inv = useInvalidateOrgs(); return useLeaveOrganization({ mutation: { onSuccess: inv } }); }
export function useTransferOwnership() { const inv = useInvalidateOrgs(); return useTransferOrganizationOwnership({ mutation: { onSuccess: inv } }); }
export function useArchiveOrg() { const inv = useInvalidateOrgs(); return useArchiveOrganization({ mutation: { onSuccess: inv } }); }
export function useAcceptInvite() { const inv = useInvalidateOrgs(); return useAcceptOrganizationInvitation({ mutation: { onSuccess: inv } }); }
export function useSelectWs() { const inv = useInvalidateOrgs(); return useSelectWorkspace({ mutation: { onSuccess: inv } }); }

export const isManager = (r?: OrganizationRole) => r === "owner" || r === "admin";
/** Whether actor may change role of / remove a target. Owner is never a target. */
export function canActOn(actor: OrganizationRole | undefined, target: OrganizationRole) {
  if (actor === "owner") return target !== "owner";
  if (actor === "admin") return target === "member" || target === "viewer";
  return false;
}
export function assignableRoles(actor?: OrganizationRole): ("admin" | "member" | "viewer")[] {
  if (actor === "owner") return ["admin", "member", "viewer"];
  if (actor === "admin") return ["member", "viewer"];
  return [];
}
export function inviteLink(token: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}/invite?token=${encodeURIComponent(token)}`;
}
