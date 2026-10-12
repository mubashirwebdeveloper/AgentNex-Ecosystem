import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={cn("h-8 w-8 shrink-0", className)}>
      <defs>
        <linearGradient id="lm-g" x1="8" y1="56" x2="56" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2F7BFF" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0A1230" />
      <path d="M32 10 L52 52 H42 L32 30 L22 52 H12 Z" fill="url(#lm-g)" />
      <path d="M24 42 H40" stroke="#FF8A3D" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="10" r="3.5" fill="#22D3EE" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="font-display text-[17px] font-bold tracking-[0.08em]">AGENT<span className="text-primary">NEX</span></span>}
    </span>
  );
}
