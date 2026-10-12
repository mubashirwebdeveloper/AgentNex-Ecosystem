import { UserRound, Building2, Code2 } from "lucide-react";
import type { ProfileInputAccountType, ProfileInputLanguage } from "@workspace/api-client-react";
import { ACCOUNT_TYPES, LANGUAGES } from "@/lib/nav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ICONS = { individual: UserRound, business: Building2, developer: Code2 } as const;

export function AccountTypePicker({ value, onChange }: { value: ProfileInputAccountType; onChange: (v: ProfileInputAccountType) => void }) {
  return (
    <div role="radiogroup" aria-label="Account type" className="grid gap-3 sm:grid-cols-3">
      {ACCOUNT_TYPES.map((t) => {
        const on = t.value === value;
        const Icon = ICONS[t.value];
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(t.value)}
            data-testid={`radio-account-${t.value}`}
            className={cn(
              "relative rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98]",
              on ? "border-primary bg-primary/10 shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]" : "border-border bg-background/50 hover:border-primary/40",
            )}
          >
            <Icon className={cn("h-5 w-5", on ? "text-primary" : "text-muted-foreground")} aria-hidden />
            <p className="mt-3 text-sm font-semibold">{t.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
            <span className={cn("absolute right-3 top-3 h-3.5 w-3.5 rounded-full border-2 transition-colors", on ? "border-primary bg-primary" : "border-border")} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

export function LanguageSelect({ id, value, onChange }: { id?: string; value: ProfileInputLanguage; onChange: (v: ProfileInputLanguage) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ProfileInputLanguage)}>
      <SelectTrigger id={id} className="h-11 rounded-xl bg-background/60" data-testid="select-language"><SelectValue /></SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export const LANGUAGE_NOTE = "Saved as your preference for future localization. The interface currently displays in English.";
