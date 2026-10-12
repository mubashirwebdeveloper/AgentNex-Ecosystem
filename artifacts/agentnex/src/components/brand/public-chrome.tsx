import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Menu, ArrowRight } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/app/theme-sync";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const LINKS = [
  { label: "Product", href: `${base}/#product` },
  { label: "Global Network", href: `${base}/network`, route: "/network" },
  { label: "Solutions", href: `${base}/#solutions` },
  { label: "Marketplace", href: `${base}/#marketplace` },
  { label: "Developers", href: `${base}/#developers` },
  { label: "Pricing", href: `${base}/#pricing` },
];

function NavLink({ l, className, onClick }: { l: (typeof LINKS)[number]; className: string; onClick?: () => void }) {
  if (l.route) return <Link href={l.route} className={className} onClick={onClick} data-testid={`link-header-${l.label.toLowerCase().replace(/\s/g, "-")}`}>{l.label}</Link>;
  return <a href={l.href} className={className} onClick={onClick} data-testid={`link-header-${l.label.toLowerCase().replace(/\s/g, "-")}`}>{l.label}</a>;
}

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "border-b border-border/70 bg-background/80 backdrop-blur-xl" : "bg-transparent")}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to content</a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="AGENTNEX home" data-testid="link-home"><Logo /></Link>
        <nav aria-label="Primary" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {LINKS.map((l) => <NavLink key={l.label} l={l} className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground" />)}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          <Link href="/sign-in" className="hidden rounded-full border border-border px-4 py-2 text-[13px] font-semibold transition-colors hover:border-primary/60 sm:inline-flex" data-testid="link-login">Login</Link>
          <Link href="/sign-up" className="group hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.7)] transition-transform hover:-translate-y-px sm:inline-flex" data-testid="link-get-started-header">
            Get Started <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border lg:hidden" aria-label="Open menu" data-testid="button-public-menu">
            <Menu className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[300px] bg-background">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
          <div className="mt-6 flex flex-col gap-1">
            {LINKS.map((l) => <NavLink key={l.label} l={l} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-card" />)}
            <div className="mt-4 grid gap-2">
              <Link href="/sign-in" className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-semibold">Login</Link>
              <Link href="/sign-up" className="rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground">Get Started</Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

const FOOT = [
  { h: "Product", items: [["What is AGENTNEX", `${base}/#product`], ["How it works", `${base}/#how`], ["Agent Passport", `${base}/#passport`], ["Trust & verification", `${base}/#trust`]] },
  { h: "Solutions", items: [["Business networking", `${base}/#solutions`], ["Marketplace", `${base}/#marketplace`], ["Workflows", `${base}/#workflows`], ["Procurement", `${base}/#procurement`]] },
  { h: "Build", items: [["Developer Platform", `${base}/#developers`], ["Security principles", `${base}/#security`], ["Global network", `${base}/network`], ["Pricing", `${base}/#pricing`]] },
  { h: "Account", items: [["Create account", `${base}/sign-up`], ["Log in", `${base}/sign-in`], ["FAQ", `${base}/#faq`]] },
];

export function PublicFooter() {
  return (
    <footer className="relative border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">The Global Network for AI Agents, Businesses &amp; People. Currently in Phase 1: identity, onboarding and account foundation.</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden /> Phase 1 foundation
          </p>
        </div>
        {FOOT.map((c) => (
          <div key={c.h}>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{c.h}</h3>
            <ul className="mt-3 space-y-2">
              {c.items.map(([l, h]) => <li key={l}><a href={h} className="text-sm text-foreground/80 transition-colors hover:text-primary">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>&copy; {new Date().getFullYear()} AGENTNEX. All rights reserved.</p>
          <p>Visuals describe the planned ecosystem. Features marked as future are not yet available.</p>
        </div>
      </div>
    </footer>
  );
}
