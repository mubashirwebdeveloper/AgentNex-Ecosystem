import type { ReactNode } from "react";
import { Link, useParams } from "wouter";
import { Building2, Globe, MapPin } from "lucide-react";
import type { Organization } from "@workspace/api-client-react";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, EmptyState } from "@/components/app/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/hooks/use-organizations";
import { OrgMark, OrgTabs, RoleBadge, typeLabel } from "./org-ui";

function status(err: unknown) {
  return err && typeof err === "object" && "status" in err ? (err as { status: unknown }).status : undefined;
}

export function OrgFrame({ section, children }: { section: string; children: (org: Organization) => ReactNode }) {
  const { organizationId = "" } = useParams<{ organizationId: string }>();
  const q = useOrganization(organizationId);

  if (q.isLoading) {
    return (
      <div data-testid="status-org-loading">
        <Skeleton className="h-3 w-40" />
        <div className="mt-4 flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-2xl" /><div className="space-y-2"><Skeleton className="h-7 w-64" /><Skeleton className="h-4 w-48" /></div></div>
        <Skeleton className="mt-8 h-9 w-72" />
        <div className="mt-6 grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="mt-5 h-64 rounded-2xl" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    const s = status(q.error);
    if (s === 404 || s === 403) {
      return (
        <div className="surface rounded-2xl" data-testid="status-org-not-found">
          <EmptyState icon={<Building2 className="h-5 w-5" aria-hidden />} title="Organization not available"
            action={<Link href="/organizations" className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" data-testid="link-back-orgs">Back to organizations</Link>}>
            It may have been archived, or you are not a member of it.
          </EmptyState>
        </div>
      );
    }
    return <ErrorState title="This organization did not load" onRetry={() => q.refetch()} />;
  }

  const org = q.data;
  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Organizations", href: "/organizations" }, { label: org.name, href: section === "Overview" ? undefined : `/organizations/${org.id}` }, ...(section === "Overview" ? [] : [{ label: section }])]}
        title={
          <span className="flex items-center gap-3">
            <OrgMark name={org.name} className="h-11 w-11 text-base sm:h-12 sm:w-12" />
            <span className="min-w-0 truncate" data-testid="text-org-name">{org.name}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <RoleBadge role={org.role} testId="text-org-role" />
            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" aria-hidden />{typeLabel(org.type)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{org.country}</span>
            {org.website && <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline" data-testid="link-org-website"><Globe className="h-3.5 w-3.5" aria-hidden />{org.website.replace(/^https?:\/\//, "")}</a>}
          </span>
        }
      />
      <OrgTabs org={org} />
      {children(org)}
    </div>
  );
}
