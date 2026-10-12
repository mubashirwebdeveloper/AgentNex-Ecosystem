import { Link } from "wouter";
import { ArrowRight, Building2, Check, MapPin, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, EmptyState } from "@/components/app/states";
import { Skeleton } from "@/components/ui/skeleton";
import { OrgMark, RoleBadge, typeLabel, fmtDate } from "@/components/org/org-ui";
import { useOrganizations, useWorkspace, isManager } from "@/hooks/use-organizations";
import { usePageMeta } from "@/lib/meta";

export default function OrganizationsPage() {
  usePageMeta("Organizations", "Organizations you belong to on AGENTNEX, with your role in each.");
  const q = useOrganizations();
  const ws = useWorkspace();
  const selected = ws.data?.selectedOrganizationId ?? null;

  const newBtn = (
    <Link href="/organizations/new" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110" data-testid="link-create-org">
      <Plus className="h-4 w-4" aria-hidden />New organization
    </Link>
  );

  return (
    <div>
      <PageHeader crumbs={[{ label: "Organizations" }]} title="Organizations" description="Teams you belong to. Your personal identity remains independent of any organization." actions={newBtn} />
      {q.isLoading ? (
        <div className="space-y-3" data-testid="status-orgs-loading">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : q.isError ? (
        <ErrorState title="Organizations did not load" onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <div className="surface rounded-2xl py-6" data-testid="status-orgs-empty">
          <EmptyState icon={<Building2 className="h-5 w-5" aria-hidden />} title="You are not part of an organization yet" action={newBtn}>
            Create one for your company or team, or open an invitation link someone shared with you.
          </EmptyState>
        </div>
      ) : (
        <>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground" data-testid="text-orgs-count">{q.data.length} {q.data.length === 1 ? "organization" : "organizations"}</p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {q.data.map((o) => (
              <li key={o.id}>
                <Link href={`/organizations/${o.id}`} data-testid={`card-org-${o.id}`} className="surface group flex items-start gap-4 rounded-2xl p-5 transition-colors hover:border-primary/50">
                  <OrgMark name={o.name} className="h-12 w-12 text-base" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold">{o.name}</h2>
                      <RoleBadge role={o.role} />
                      {selected === o.id && <span className="inline-flex items-center gap-1 rounded-full bg-cyan/12 px-2 py-0.5 text-[10px] font-semibold text-cyan"><Check className="h-3 w-3" aria-hidden />Active context</span>}
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{typeLabel(o.type)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{o.country}</span>
                      <span>Since {fmtDate(o.createdAt)}</span>
                    </p>
                    <div className="mt-3 flex gap-4 text-xs">
                      <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" aria-hidden /><span className="font-semibold">{o.memberCount}</span> {o.memberCount === 1 ? "member" : "members"}</span>
                      {isManager(o.role) && <span className="text-muted-foreground"><span className="font-semibold text-ember">{o.pendingInvitationCount}</span> pending</span>}
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
