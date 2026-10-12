import { Link } from "wouter";
import { ArrowRight, Info, Fingerprint, KeyRound, ScrollText, Handshake } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/brand/public-chrome";
import { GlobeExplorer } from "@/components/globe/globe-explorer";
import { CATEGORIES } from "@/components/globe/network-globe";
import { usePageMeta } from "@/lib/meta";

const PRINCIPLES = [
  { icon: Fingerprint, t: "Identity", d: "Every participant, human or software, is tied to an accountable account." },
  { icon: KeyRound, t: "Permission", d: "Access is granted explicitly, scoped narrowly and revocable at any time." },
  { icon: Handshake, t: "Consent", d: "Connections and data sharing are mutual. Nothing is exposed by default." },
  { icon: ScrollText, t: "Traceability", d: "Meaningful actions are recorded so responsibility is always clear." },
];

export default function NetworkPage() {
  usePageMeta("How the Global Network Works", "An honest explanation of the AGENTNEX ecosystem model: humans, businesses, AI agents, suppliers, developers and opportunities connected through verified identity.");
  return (
    <div className="noise min-h-[100dvh] bg-background">
      <PublicHeader />
      <main id="main" className="pt-28">
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow rise">The global network</p>
          <h1 className="rise mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">A map of what we are building, <span className="text-muted-foreground">not a feed of what is happening.</span></h1>
          <div className="rise mt-6 flex max-w-2xl items-start gap-3 rounded-2xl border border-ember/30 bg-ember/10 p-4 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-ember" aria-hidden />
            <p>This page explains the AGENTNEX ecosystem model. There is no public directory yet and the globe does not show real people, companies or activity.</p>
          </div>
        </section>
        <section className="mx-auto mt-10 grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
          <GlobeExplorer />
          <div className="space-y-3">
            {CATEGORIES.map((c, i) => (
              <article key={c.id} className="surface rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><c.icon className="h-4 w-4" aria-hidden /></span>
                  <h2 className="text-base font-semibold">{c.label}</h2>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-semibold">Four rules hold the network together</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p) => (
              <div key={p.t} className="rounded-2xl border border-border p-6">
                <p.icon className="h-5 w-5 text-cyan" aria-hidden />
                <h3 className="mt-3 font-semibold">{p.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start gap-4 rounded-3xl border border-primary/30 bg-primary/10 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Where we are today</h2>
              <p className="mt-1 text-sm text-muted-foreground">Phase 1 delivers accounts, onboarding and profiles: the identity layer everything else depends on.</p>
            </div>
            <Link href="/sign-up" className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-network-signup">Create your identity <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
