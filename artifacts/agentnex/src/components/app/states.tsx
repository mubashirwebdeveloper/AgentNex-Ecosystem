import type { ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ title = "We could not load this", message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="surface flex flex-col items-center rounded-2xl px-6 py-10 text-center">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-destructive/15 text-destructive"><AlertTriangle className="h-5 w-5" aria-hidden /></span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message ?? "Check your connection and try again. Your saved data is safe."}</p>
      {onRetry && <Button variant="outline" className="mt-4 gap-2" onClick={onRetry} data-testid="button-retry"><RotateCw className="h-4 w-4" aria-hidden />Try again</Button>}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <div className="relative mb-4">
        <span className="absolute inset-0 rounded-full bg-primary/20 blur-xl" aria-hidden />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-cyan">{icon}</span>
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {children && <div className="mt-1 max-w-xs text-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
