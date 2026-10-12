import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { useMe, useSavePreferences } from "@/hooks/use-account";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Applies the server-saved theme when a signed-in profile loads. */
export function ThemeSync() {
  const { data } = useMe();
  const { setTheme } = useTheme();
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (data && applied.current !== `${data.id}:${data.theme}`) {
      applied.current = `${data.id}:${data.theme}`;
      setTheme(data.theme);
    }
  }, [data, setTheme]);
  return null;
}

export function useThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { isSignedIn } = useAuth();
  const save = useSavePreferences();
  const { toast } = useToast();
  const mutateRef = useRef(save.mutate);
  mutateRef.current = save.mutate;
  const apply = (next: Theme) => {
    const prev = theme;
    setTheme(next);
    if (isSignedIn) {
      mutateRef.current(
        { data: { theme: next } },
        { onError: () => { setTheme(prev); toast({ title: "Theme not saved", description: "We could not save your theme. Please try again.", variant: "destructive" }); } },
      );
    }
  };
  return { theme, apply, pending: save.isPending };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, apply } = useThemeToggle();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={`Switch to ${next} theme`}
      data-testid="button-theme-toggle"
      className={cn("relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground", className)}
    >
      <Sun className={cn("absolute h-4 w-4 transition-all duration-300", theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} aria-hidden />
      <Moon className={cn("absolute h-4 w-4 transition-all duration-300", theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} aria-hidden />
    </button>
  );
}
