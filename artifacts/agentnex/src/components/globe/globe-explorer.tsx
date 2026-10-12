import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { CATEGORIES, NetworkGlobe, type CategoryId } from "./network-globe";
import { cn } from "@/lib/utils";

export function GlobeExplorer({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const reduce = useReducedMotion();
  const active = CATEGORIES.find((c) => c.id === selected);

  return (
    <div className={cn("relative", className)}>
      <div className={cn("relative mx-auto aspect-square w-full", compact ? "max-w-[380px]" : "max-w-[620px]")}>
        <NetworkGlobe selected={selected} onSelect={setSelected} className="absolute inset-0 h-full w-full" showLabels={!compact} />
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
