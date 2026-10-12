import type { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export function PageHeader({ crumbs, title, description, actions }: { crumbs: { label: string; href?: string }[]; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
                {c.href ? <Link href={c.href} className="hover:text-foreground">{c.label}</Link> : <span aria-current="page" className="text-foreground/80">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-2xl font-semibold sm:text-3xl" data-testid="text-page-title">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
