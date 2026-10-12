import { Link } from "wouter";
import { Clock, CheckCircle2, ArrowRight, Info } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
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
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]" data-testid={`panel-coming-${item.slug}`}>
        <section className="surface rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-cyan"><Icon className="h-6 w-6" aria-hidden /></span>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ember/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ember"><Clock className="h-3 w-3" aria-hidden />{item.phase === "Phase 2" ? "Phase 2" : "Later phase"}</span>
              <h2 className="mt-3 text-xl font-semibold">This module is not available yet.</h2>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">Rather than show placeholder data, this page describes what is planned. Nothing here performs an action.</p>
            </div>
          </div>
          {item.planned && (
            <>
              <h3 className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Planned scope</h3>
              <ol className="mt-4 space-y-0">
                {item.planned.map((p, i, a) => (
                  <li key={p} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < a.length - 1 && <span className="absolute left-[11px] top-6 h-full w-px bg-border" aria-hidden />}
                    <span className="relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                    <span className="pt-0.5 text-sm">{p}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
        <aside className="space-y-5">
          <section className="surface rounded-2xl p-6">
            <h3 className="text-sm font-semibold">Delivery path</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[["Phase 1", "Identity, profile, preferences", true], ["Phase 2", "Organizations and roles", item.phase === "Phase 2"], ["Later", "Network, agents, automation", item.phase !== "Phase 2"]].map(([ph, d, hl]) => (
                <li key={String(ph)} className="flex items-start gap-3">
                  {ph === "Phase 1" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden /> : <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2", hl ? "border-ember" : "border-border")} aria-hidden />}
                  <span><span className={cn("block font-medium", hl && ph !== "Phase 1" && "text-ember")}>{ph}{ph === "Phase 1" ? " · live" : hl ? " · this module" : ""}</span><span className="block text-xs text-muted-foreground">{d}</span></span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-6">
            <h3 className="text-sm font-semibold">Prepare now</h3>
            <p className="mt-1.5 text-xs text-muted-foreground">The profile you complete today carries into this module when it launches.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/profile" className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground" data-testid="link-module-profile">Strengthen profile <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
              <Link href="/dashboard" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-xs font-semibold hover:border-primary/50" data-testid="link-module-dashboard">Back to overview</Link>
            </div>
          </section>
        </aside>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Info className="h-3.5 w-3.5" aria-hidden />The profile you complete now will carry into this module when it launches.</p>
    </div>
  );
}
