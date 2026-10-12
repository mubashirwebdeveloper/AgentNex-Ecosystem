import type { ReactNode } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Fingerprint, ShieldCheck, KeyRound, Eye, ScrollText, Lock, UserCheck, BadgeCheck, Building2,
  Handshake, Store, Workflow, PackageSearch, Code2, Bot, CheckCircle2, CircleDashed, Globe2, Layers, Scale,
} from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/brand/public-chrome";
import { GlobeExplorer } from "@/components/globe/globe-explorer";
import { CATEGORIES } from "@/components/globe/network-globe";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Status({ kind }: { kind: "live" | "vision" | "proposed" }) {
  const map = {
    live: { t: "Live in Phase 1", c: "border-cyan/40 text-cyan" },
    vision: { t: "Vision · later phase", c: "border-ember/40 text-ember" },
    proposed: { t: "Proposed", c: "border-ember/40 text-ember" },
  }[kind];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest", map.c)}><span className="h-1 w-1 rounded-full bg-current" aria-hidden />{map.t}</span>;
}

function SectionHead({ id, eyebrow, title, children, status, center }: { id?: string; eyebrow: string; title: ReactNode; children?: ReactNode; status?: "live" | "vision" | "proposed"; center?: boolean }) {
  return (
    <Reveal className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <div className={cn("flex flex-wrap items-center gap-3", center && "justify-center")}>
        <p className="eyebrow" id={id ? `${id}-label` : undefined}>{eyebrow}</p>
        {status && <Status kind={status} />}
      </div>
      <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-[2.6rem]">{title}</h2>
      {children && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{children}</p>}
    </Reveal>
  );
}

const HOW = [
  { n: "01", t: "Establish identity", d: "Create an account and a profile you control: who you are, where you operate, how you prefer to work.", icon: Fingerprint, live: true },
  { n: "02", t: "Verify and represent", d: "Add verification signals and, later, represent organizations or register agents that act on your behalf.", icon: BadgeCheck, live: false },
  { n: "03", t: "Discover with consent", d: "Find verified people, businesses and agents. Nothing is shared or connected without permission.", icon: Globe2, live: false },
  { n: "04", t: "Collaborate and automate", d: "Run workflows, requests and agent tasks with scoped permissions, human approvals and audit trails.", icon: Workflow, live: false },
];

const TRUST = [
  { icon: UserCheck, t: "Owned identity", d: "Your profile belongs to your account. You decide what is visible." },
  { icon: BadgeCheck, t: "Verification signals", d: "Planned checks for email, domain and business registration, shown transparently." },
  { icon: KeyRound, t: "Scoped permissions", d: "Agents and integrations receive only the access you grant, and you can revoke it." },
  { icon: ScrollText, t: "Traceable actions", d: "Every meaningful action is designed to be attributable to an accountable owner." },
];

const SECURITY = [
  { icon: Lock, t: "Server-side authorization", d: "Every request is checked on the server against the authenticated account." },
  { icon: Eye, t: "Minimal exposure", d: "No public user directory in Phase 1. Profile data stays private to its owner." },
  { icon: ShieldCheck, t: "Validated input", d: "All updates are validated against strict schemas before they reach the database." },
  { icon: Scale, t: "Human in the loop", d: "Future agent workflows are designed around explicit approval checkpoints." },
  { icon: Layers, t: "Separated concerns", d: "Identity, permissions and business logic live in distinct, auditable layers." },
  { icon: KeyRound, t: "Managed secrets", d: "Credentials live in environment-managed secrets, never in client bundles." },
];

const PRICING = [
  { name: "Explorer", price: "Free", note: "Available now", desc: "Create your identity, complete onboarding, manage your profile and preferences.", items: ["Personal account and profile", "Onboarding and dashboard", "Theme, language and timezone preferences"], live: true },
  { name: "Professional", price: "To be announced", note: "Proposed", desc: "For individuals and developers who want verification and their first agents.", items: ["Verification signals", "Agent Passports", "Developer API access"], live: false, featured: true },
  { name: "Organization", price: "To be announced", note: "Proposed", desc: "For businesses coordinating teams, suppliers and agents.", items: ["Organizations and roles", "Procurement and workflows", "Audit and governance controls"], live: false },
];

const FAQ = [
  ["What can I do on AGENTNEX today?", "Phase 1 lets you create an account, complete a three-step onboarding, manage your profile, and set theme, language and timezone preferences. Your dashboard tracks real setup progress. Networking, agents, marketplace and workflows are planned for later phases."],
  ["Are the globe and network visuals live data?", "No. The globe is a concept illustration of the ecosystem AGENTNEX intends to build. It does not display real users, activity or statistics."],
  ["Do I need an organization to sign up?", "No. Personal accounts work on their own. Organizations with role-based access are available whenever you need a team workspace."],
  ["What is an AI Agent Passport?", "A planned identity record for AI agents: who owns the agent, what it can do, what it is permitted to do, and a trail of what it has done. It is not available yet."],
  ["Is pricing final?", "No. Only the free Explorer tier exists today. Other tiers shown are proposals and are not available for purchase."],
  ["Is the interface translated into my language?", "Not yet. You can save a preferred language now so it is ready for future localization; the interface currently displays in English."],
];

export default function Landing() {
  usePageMeta(
    "AGENTNEX — The Global Network for AI Agents, Businesses & People",
    "AGENTNEX is building trusted global identity for people, businesses and AI agents. Create your account today and help shape the network.",
  );
  const reduce = useReducedMotion();

  return (
    <div className="noise relative min-h-[100dvh] overflow-x-hidden bg-background">
      <PublicHeader />
      <main id="main">
        {/* HERO */}
        <section className="relative pt-24 pb-14 sm:pt-28 lg:pb-16">
          <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="rise inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan">
                <Globe2 className="h-3.5 w-3.5" aria-hidden /> Global identity foundation
              </p>
              <h1 className="rise mt-5 text-[2.3rem] font-bold leading-[1.05] sm:text-5xl xl:text-[3.5rem]" style={{ animationDelay: "80ms" }}>
                The Global Network for <span className="text-gradient">AI Agents</span>, <span className="text-gradient">Businesses</span> <span className="text-ember">&amp;</span> People
              </h1>
              <p className="rise mt-4 font-display text-lg font-medium text-foreground/90 sm:text-xl" style={{ animationDelay: "160ms" }}>Connect. Collaborate. Automate. Grow.</p>
              <p className="rise mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground" style={{ animationDelay: "220ms" }}>
                AGENTNEX is building shared infrastructure where people, companies, suppliers, developers and AI agents can prove who they are, find each other, and work together under clear permissions. It starts with something simple and essential: an identity you own.
              </p>
              <div className="rise mt-6 flex flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
                <Link href="/sign-up" className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_32px_-10px_hsl(var(--primary)/0.8)] transition-transform hover:-translate-y-0.5 active:translate-y-0" data-testid="link-get-started-hero">
                  Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
                <Link href="/network" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-6 py-3 text-sm font-semibold transition-colors hover:border-cyan/60" data-testid="link-explore-network">
                  Explore the Network
                </Link>
              </div>
              <dl className="rise mt-7 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6" style={{ animationDelay: "380ms" }}>
                {[["6", "participant types in the model"], ["3", "steps to set up your identity"], ["0", "fabricated metrics, ever"]].map(([v, l]) => (
                  <div key={l}><dt className="sr-only">{l}</dt><dd className="font-display text-2xl font-semibold">{v}</dd><dd className="mt-1 text-xs leading-snug text-muted-foreground">{l}</dd></div>
                ))}
              </dl>
            </div>
            <div className="rise relative" style={{ animationDelay: "200ms" }}>
              <GlobeExplorer callouts />
            </div>
          </div>
        </section>

        {/* WHAT */}
        <section id="product" className="scroll-mt-20 border-t border-border/60 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <SectionHead eyebrow="What is AGENTNEX" title={<>One trusted layer for everyone <span className="text-muted-foreground">and everything</span> that does business.</>}>
              As AI agents begin to negotiate, buy, schedule and build on behalf of people and companies, the internet needs a way to answer basic questions: Who is this? Who is responsible for it? What is it allowed to do? AGENTNEX is designed to answer them.
            </SectionHead>
            <Reveal delay={0.1} className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Fingerprint, t: "Identity first", d: "Every participant starts with an accountable, owner-controlled profile." },
                { icon: ShieldCheck, t: "Trust by design", d: "Verification and permissions are part of the foundation, not an add-on." },
                { icon: Handshake, t: "Collaboration", d: "Discovery and connections between verified parties, with consent." },
                { icon: Bot, t: "Agent-ready", d: "Built for a future where software agents act alongside humans." },
              ].map((x, i) => (
                <div key={x.t} className={cn("surface rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1", i === 1 && "sm:translate-y-6")}>
                  <x.icon className="h-5 w-5 text-cyan" aria-hidden />
                  <h3 className="mt-3 text-sm font-semibold">{x.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{x.d}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHead eyebrow="How the network works" title="From a single profile to a working network." center>
              Four layers, built in order. Step one is live today. The rest arrive phase by phase, each on top of the last.
            </SectionHead>
            <ol className="relative mt-14 grid gap-4 md:grid-cols-4">
              <div className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-primary via-cyan to-transparent md:block" aria-hidden />
              {HOW.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.08}>
                  <li className="relative">
                    <span className={cn("relative z-10 inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl border bg-background", s.live ? "border-cyan/60 text-cyan" : "border-border text-muted-foreground")}>
                      <s.icon className="h-6 w-6" aria-hidden />
                    </span>
                    <p className="mt-5 font-mono text-xs text-muted-foreground">{s.n}</p>
                    <h3 className="mt-1 text-lg font-semibold">{s.t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                    <div className="mt-3"><Status kind={s.live ? "live" : "vision"} /></div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ECOSYSTEM */}
        <section id="ecosystem" className="scroll-mt-20 border-y border-border/60 bg-card/30 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHead eyebrow="Connected global ecosystem" title="Six kinds of participants. One shared language of trust." status="vision" />
            <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((c, i) => (
                <Reveal key={c.id} delay={(i % 3) * 0.06} className="group bg-background p-6 transition-colors hover:bg-card sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-ember/15 group-hover:text-ember"><c.icon className="h-5 w-5" aria-hidden /></span>
                    <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{c.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>
                  <p className="mt-4 border-t border-border pt-3 text-xs text-foreground/75">{c.role}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PASSPORT */}
        <section id="passport" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
            <SectionHead eyebrow="AI Agent Passport" title="Every agent should be able to show its papers." status="vision">
              A passport is a planned identity record for an AI agent. It ties the agent to an accountable owner, declares what it can do, limits what it may do, and keeps a record of what it did. Anyone interacting with the agent can check before they trust.
            </SectionHead>
            <Reveal delay={0.1}>
              <figure className="relative mx-auto max-w-md">
                <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/25 via-transparent to-ember/20 blur-2xl" aria-hidden />
                <div className="surface relative overflow-hidden rounded-3xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Agent Passport</p>
                      <p className="mt-2 font-display text-xl font-semibold">Example procurement agent</p>
                      <p className="text-xs text-muted-foreground">Illustrative layout · not a real agent</p>
                    </div>
                    <Bot className="h-9 w-9 text-primary" aria-hidden />
                  </div>
                  <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    {[["Owner", "Verified business"], ["Status", "Active, revocable"], ["Capabilities", "Request quotes, compare offers"], ["Limits", "Approval required above threshold"]].map(([k, v]) => (
                      <div key={k}><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt><dd className="mt-1 text-foreground/90">{v}</dd></div>
                    ))}
                  </dl>
                  <div className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                    <ScrollText className="h-4 w-4 text-ember" aria-hidden /> Every action logged to the owner&apos;s audit trail
                  </div>
                  <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full border-[18px] border-primary/10" aria-hidden />
                </div>
                <figcaption className="sr-only">Illustration of the planned Agent Passport layout.</figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        {/* TRUST */}
        <section id="trust" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="surface relative overflow-hidden rounded-[2rem] p-8 sm:p-12">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" aria-hidden />
              <SectionHead eyebrow="Trust, identity & verification" title="Trust is earned in layers, and shown honestly." />
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {TRUST.map((x, i) => (
                  <Reveal key={x.t} delay={i * 0.06}>
                    <x.icon className="h-5 w-5 text-cyan" aria-hidden />
                    <h3 className="mt-3 font-semibold">{x.t}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{x.d}</p>
                  </Reveal>
                ))}
              </div>
              <p className="mt-10 text-xs text-muted-foreground">Today: account-level identity through secure authentication. Verification badges are not issued yet.</p>
            </div>
          </div>
        </section>

        {/* BUSINESS + MARKETPLACE */}
        <section id="solutions" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-5">
              <Reveal className="surface rounded-3xl p-8 lg:col-span-3">
                <div className="flex flex-wrap items-center gap-3"><p className="eyebrow">Business networking & collaboration</p><Status kind="vision" /></div>
                <h2 className="mt-3 text-3xl font-semibold">Meet partners you can verify, not just profiles you hope are real.</h2>
                <p className="mt-4 text-muted-foreground">Companies will represent themselves through verified organization profiles, invite their teams, and open collaboration spaces with partners. Connections are mutual and consent-based.</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {["Verified organization profiles", "Mutual, consent-based connections", "Shared collaboration spaces", "Roles for every team member"].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />{t}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.08} className="lg:col-span-2">
                <div id="marketplace" className="relative h-full scroll-mt-24 overflow-hidden rounded-3xl border border-ember/30 bg-gradient-to-br from-ember/10 via-card to-card p-8">
                  <div className="flex flex-wrap items-center gap-3"><p className="eyebrow !text-ember">AI Agent Marketplace</p><Status kind="vision" /></div>
                  <h2 className="mt-3 text-2xl font-semibold">Agents with listings you can actually read.</h2>
                  <p className="mt-4 text-sm text-muted-foreground">A planned marketplace where publishers list agents alongside their declared permissions, publisher identity and support terms. Installing an agent will always require explicit consent.</p>
                  <Store className="absolute -bottom-6 -right-6 h-36 w-36 text-ember/10" aria-hidden />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* WORKFLOWS */}
        <section id="workflows" className="scroll-mt-20 border-y border-border/60 bg-card/30 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
            <Reveal className="order-2 lg:order-1">
              <div className="relative mx-auto max-w-md" role="img" aria-label="Illustrative workflow: trigger, agent step, human approval, completion">
                {[
                  { t: "Trigger", s: "A request arrives", c: "border-primary/50", i: CircleDashed },
                  { t: "Agent step", s: "Scoped to granted permissions", c: "border-cyan/50", i: Bot },
                  { t: "Human approval", s: "A person signs off", c: "border-ember/60", i: UserCheck },
                  { t: "Complete", s: "Recorded in the audit trail", c: "border-border", i: CheckCircle2 },
                ].map((n, i, a) => (
                  <div key={n.t} className="relative">
                    <motion.div
                      initial={reduce ? false : { opacity: 0, x: i % 2 ? 20 : -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.12, duration: 0.5 }}
                      className={cn("flex items-center gap-3 rounded-2xl border bg-background p-4", n.c, i % 2 ? "ml-10" : "mr-10")}
                    >
                      <n.i className="h-5 w-5 shrink-0 text-foreground/80" aria-hidden />
                      <div><p className="text-sm font-semibold">{n.t}</p><p className="text-xs text-muted-foreground">{n.s}</p></div>
                    </motion.div>
                    {i < a.length - 1 && <div className="mx-auto h-6 w-px bg-gradient-to-b from-border to-cyan/60" aria-hidden />}
                  </div>
                ))}
              </div>
            </Reveal>
            <div className="order-1 lg:order-2">
              <SectionHead eyebrow="Workflow automation" title="Automation that knows when to stop and ask." status="vision">
                Workflows will combine people and agents into repeatable processes. Agents do the legwork within their permissions; humans keep the decisions that matter. Every run is recorded.
              </SectionHead>
            </div>
          </div>
        </section>

        {/* PROCUREMENT */}
        <section id="procurement" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHead eyebrow="Procurement & supplier collaboration" title="Requests for quotation between parties who know who they are dealing with." status="vision" />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                { t: "Publish a request", d: "Describe what you need. Choose who can see it.", icon: PackageSearch },
                { t: "Receive verified quotes", d: "Suppliers respond through their verified profiles, optionally assisted by agents.", icon: BadgeCheck },
                { t: "Approve with confidence", d: "Compare, decide and approve with a clear record of how the decision was made.", icon: CheckCircle2 },
              ].map((x, i) => (
                <Reveal key={x.t} delay={i * 0.08} className="surface rounded-2xl p-6">
                  <div className="flex items-center gap-3"><span className="font-mono text-xs text-ember">0{i + 1}</span><x.icon className="h-5 w-5 text-cyan" aria-hidden /></div>
                  <h3 className="mt-4 font-semibold">{x.t}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{x.d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* DEVELOPERS */}
        <section id="developers" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <SectionHead eyebrow="Developer Platform & APIs" title="Build agents and integrations on documented, permissioned APIs." status="vision">
              Scoped API keys, webhooks for identity and workflow events, and a sandbox to test against. The interfaces are still being designed with the same rules as the product: least privilege, clear ownership, full traceability.
            </SectionHead>
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-2xl border border-border bg-[hsl(226_55%_4%)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                  <div className="flex gap-1.5" aria-hidden><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-[#FF8A3D]/70" /></div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Design sketch · not a live endpoint</span>
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-[#cfe3ff]"><code>{`// Planned shape of an agent registration
POST /v1/agents
{
  "name": "quote-assistant",
  "owner": "org_...",
  "capabilities": ["rfq.read", "quote.draft"],
  "requires_approval": ["quote.submit"]
}`}</code></pre>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Code2 className="h-3.5 w-3.5" aria-hidden />Public API access is not available in Phase 1.</p>
            </Reveal>
          </div>
        </section>

        {/* SECURITY */}
        <section id="security" className="scroll-mt-20 border-y border-border/60 bg-card/30 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHead eyebrow="Security & governance" title="Principles we build on from the first line of code." status="live" />
            <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {SECURITY.map((x, i) => (
                <Reveal key={x.t} delay={(i % 3) * 0.06} className="flex gap-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-cyan"><x.icon className="h-5 w-5" aria-hidden /></span>
                  <div><h3 className="font-semibold">{x.t}</h3><p className="mt-1 text-sm text-muted-foreground">{x.d}</p></div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHead eyebrow="Pricing overview" title="Start free. Paid tiers are proposals, not promises." center>
              Only Explorer is available today. Professional and Organization describe what we intend to offer; details and prices will be published before anything is sold.
            </SectionHead>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {PRICING.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.08}>
                  <div className={cn("relative flex h-full flex-col rounded-3xl border p-7", p.featured ? "border-primary/50 bg-gradient-to-b from-primary/10 to-card" : "border-border bg-card/60")}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{p.name}</h3>
                      <Status kind={p.live ? "live" : "proposed"} />
                    </div>
                    <p className="mt-4 font-display text-3xl font-semibold">{p.price}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                    <ul className="mt-6 flex-1 space-y-2.5">
                      {p.items.map((t) => <li key={t} className="flex items-start gap-2 text-sm"><CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", p.live ? "text-cyan" : "text-muted-foreground")} aria-hidden />{t}</li>)}
                    </ul>
                    {p.live ? (
                      <Link href="/sign-up" className="mt-7 inline-flex justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-pricing-signup">Create free account</Link>
                    ) : (
                      <p className="mt-7 rounded-full border border-dashed border-border px-5 py-2.5 text-center text-sm text-muted-foreground">Not yet available</p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <SectionHead eyebrow="Frequently asked" title="Straight answers." >Questions about what exists today and what comes next.</SectionHead>
            <Reveal delay={0.08}>
              <Accordion type="single" collapsible className="w-full">
                {FAQ.map(([q, a], i) => (
                  <AccordionItem key={q} value={`q${i}`} className="border-border">
                    <AccordionTrigger className="text-left text-base font-semibold hover:no-underline" data-testid={`button-faq-${i}`}>{q}</AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
          <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.2rem] border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card px-6 py-16 text-center sm:px-12">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-ember/20 blur-3xl" aria-hidden />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold sm:text-5xl">Claim your place in the network early.</h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Create your identity today. Each phase that ships builds on the profile you set up now.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/sign-up" className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-get-started-cta">
                  Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
                <Link href="/network" className="inline-flex items-center rounded-full border border-border bg-background/60 px-7 py-3 text-sm font-semibold hover:border-cyan/60">How the network works</Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
