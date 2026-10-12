import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Props = { id?: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string; searchLabel: string; testId: string; invalid?: boolean };

export function SearchSelect({ id, value, onChange, options, placeholder, searchLabel, testId, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const opts = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          data-testid={testId}
          className={cn("flex h-11 w-full items-center justify-between rounded-xl border bg-background/60 px-3.5 text-left text-sm transition-colors hover:border-primary/50", invalid ? "border-destructive" : "border-input", !value && "text-muted-foreground")}
        >
          <span className="truncate">{value ? value.replace(/_/g, " ") : placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchLabel} />
          <CommandList className="max-h-64">
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {opts.map((o) => (
                <CommandItem key={o} value={o} onSelect={() => { onChange(o); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", o === value ? "opacity-100 text-primary" : "opacity-0")} aria-hidden />
                  {o.replace(/_/g, " ")}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
