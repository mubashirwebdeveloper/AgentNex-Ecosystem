import { Link } from "wouter";
import { Clock, CheckCircle2, ArrowRight, Info } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { NAV } from "@/lib/nav";
import { usePageMeta } from "@/lib/meta";
import NotFound from "./not-found";

export default function ModulePage({ slug }: { slug: string }) {
  const item = NAV.find((n) => n.slug === slug);
  usePageMeta(item ? `${item.label} — coming later` : "Not found", item?.description ?? "Page not found");
  if (!item) return <NotFound />;
  const Icon = item.icon;
  return (
    <div>
      <PageHeader crumbs={[{ label: "Overview", href: "/dashboard" }, { label: item.label }]} title={item.label} description={item.description} />
      <section className="surface relative overflow-hidden rounded-3xl p-6 sm:p-10" data-testid={`panel-coming-${item.slug}`}>
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative grid gap-10 lg:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-36 w-36">
            <span className="pulse-ring absolute inset-6 rounded-full border border-cyan/40" aria-hidden />
            <span className="absolute inset-0 rounded-full border border-dashed border-border" aria-hidden />
            <span className="absolute inset-6 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-cyan/10 text-primary"><Icon className="h-10 w-10" aria-hidden /></span>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ember/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ember"><Clock className="h-3 w-3" aria-hidden />Coming in {item.phase === "Phase 2" ? "Phase 2" : "a later phase"}</span>
            <h2 className="mt-4 text-2xl font-semibold">This module is not available yet.</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">We are building AGENTNEX in deliberate phases. Rather than show placeholder data here, this page describes what is planned. Nothing on this page performs an action.</p>
            {item.planned && (
              <>
                <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Planned scope</h3>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {item.planned.map((p) => <li key={p} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />{p}</li>)}
                </ul>
              </>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/profile" className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="link-module-profile">Strengthen your profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
              <Link href="/dashboard" className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary/50" data-testid="link-module-dashboard">Back to overview</Link>
            </div>
          </div>
        </div>
      </section>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Info className="h-3.5 w-3.5" aria-hidden />The profile you complete now will carry into this module when it launches.</p>
    </div>
  );
}
