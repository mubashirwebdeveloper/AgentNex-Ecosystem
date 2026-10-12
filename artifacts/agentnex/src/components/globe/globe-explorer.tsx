import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { CATEGORIES, NetworkGlobe, type CategoryId } from "./network-globe";
import { cn } from "@/lib/utils";

const CALLOUT_POS = [
  "left-[2%] top-[14%]", "right-[0%] top-[8%]", "right-[-2%] top-[44%]",
  "left-[-4%] top-[46%]", "left-[6%] bottom-[10%]", "right-[4%] bottom-[8%]",
];

export function GlobeExplorer({ compact = false, callouts = false, className }: { compact?: boolean; callouts?: boolean; className?: string }) {
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const reduce = useReducedMotion();
  const active = CATEGORIES.find((c) => c.id === selected);

  return (
    <div className={cn("relative", className)}>
      <div className={cn("relative mx-auto aspect-square w-full", compact ? "max-w-[380px]" : "max-w-[620px]")}>
        <NetworkGlobe selected={selected} onSelect={setSelected} className="absolute inset-0 h-full w-full" showLabels={!compact && !callouts} />
        {callouts && (
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            {CATEGORIES.map((c, i) => {
              const on = c.id === selected;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  onClick={() => setSelected(on ? null : c.id)}
                  initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
                  className={cn(
                    "pointer-events-auto absolute flex items-center gap-2.5 rounded-xl border bg-[hsl(226_55%_7%/0.82)] py-2 pl-2 pr-3.5 text-left shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.7)] backdrop-blur-md transition-colors",
                    CALLOUT_POS[i],
                    on ? "border-ember/80" : "border-cyan/35 hover:border-cyan/80",
                  )}
                >
                  <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", on ? "bg-ember/20 text-ember" : "bg-primary/20 text-cyan")}><c.icon className="h-4 w-4" /></span>
                  <span>
                    <span className="block text-[13px] font-semibold leading-tight text-white">{c.label}</span>
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-white/55">Concept</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <div role="group" aria-label="Ecosystem categories" className={cn("flex flex-wrap justify-center gap-2", compact ? "mt-2" : "mt-4")}>
        {CATEGORIES.map((c) => {
          const on = c.id === selected;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => setSelected(on ? null : c.id)}
              data-testid={`button-category-${c.id}`}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95",
                on
                  ? "border-ember/70 bg-ember/15 text-foreground"
                  : "border-border bg-card/60 text-muted-foreground hover:border-cyan/60 hover:text-foreground",
              )}
            >
              <c.icon className={cn("h-3.5 w-3.5 transition-colors", on ? "text-ember" : "text-cyan")} aria-hidden />
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-4 min-h-[96px] max-w-xl" aria-live="polite">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="surface rounded-2xl p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <active.icon className="h-4 w-4 text-ember" aria-hidden />
                <h3 className="text-sm font-semibold">{active.label}</h3>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{active.summary}</p>
              {!compact && <p className="mt-2 text-xs text-foreground/80"><span className="font-mono text-[10px] uppercase tracking-widest text-cyan">Role</span> {active.role}</p>}
            </motion.div>
          ) : (
            <motion.p key="hint" initial={false} animate={{ opacity: 1 }} className="flex items-start justify-center gap-2 text-center text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden />
              Concept illustration of the future AGENTNEX ecosystem. Select a category or drag the globe. No live activity is shown.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <ul className="sr-only">
        {CATEGORIES.map((c) => (
          <li key={c.id}>{c.label}: {c.summary}</li>
        ))}
      </ul>
    </div>
  );
}
