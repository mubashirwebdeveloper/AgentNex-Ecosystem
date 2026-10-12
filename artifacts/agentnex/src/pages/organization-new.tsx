import { useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OrgForm } from "@/components/org/org-ui";
import { useCreateOrg } from "@/hooks/use-organizations";
import { errorMessage } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/lib/meta";

export default function OrganizationNewPage() {
  usePageMeta("New organization", "Create an organization on AGENTNEX and become its owner.");
  const create = useCreateOrg();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return (
    <div>
      <PageHeader crumbs={[{ label: "Organizations", href: "/organizations" }, { label: "New" }]} title="Create an organization" description="You become the owner. You can invite teammates once it exists." />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="surface rounded-2xl p-5 sm:p-7">
          <OrgForm submitLabel="Create organization" pending={create.isPending} onCancel={() => setLocation("/organizations")}
            onSubmit={(data) => create.mutate({ data }, {
              onSuccess: (org) => { toast({ title: "Organization created", description: org.name }); setLocation(`/organizations/${org.id}`); },
              onError: (e) => toast({ title: "Organization not created", description: errorMessage(e), variant: "destructive" }),
            })} />
        </section>
        <aside className="surface h-fit rounded-2xl p-5 text-sm">
          <ShieldCheck className="h-5 w-5 text-cyan" aria-hidden />
          <h2 className="mt-3 font-semibold">How roles work</h2>
          <dl className="mt-3 space-y-3 text-xs">
            {[["Owner", "Full control, including transfer and archive."], ["Admin", "Edits details; manages members and viewers."], ["Member", "Participates; sees the team."], ["Viewer", "Read-only access."]].map(([k, v]) => (
              <div key={k}><dt className="font-semibold">{k}</dt><dd className="text-muted-foreground">{v}</dd></div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
