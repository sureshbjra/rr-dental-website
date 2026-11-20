import { cn } from "@/lib/utils";

/** Brand mark: molar outline crossed by the scan line — the site's one recurring motif. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={cn("size-8", className)}>
      <path
        d="M9.2 4.6c-2.6 0-4.4 2.1-4.3 4.9.1 2.7 1.3 4.9 2.2 7.3.8 2.3.9 5.4 1.7 8.1.5 1.8 2.4 2.3 3 .3.6-2.1.9-4.6 2.2-5.9.8-.8 3-.8 3.8 0 1.3 1.3 1.6 3.8 2.2 5.9.6 2 2.5 1.5 3-.3.8-2.7.9-5.8 1.7-8.1.9-2.4 2.1-4.6 2.2-7.3.1-2.8-1.7-4.9-4.3-4.9-2.3 0-3.9 1.5-6.8 1.5S11.5 4.6 9.2 4.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M2.5 13.5h27" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-7" />
      <span className="font-display text-[1.05rem] font-[420] tracking-[-0.02em]">RR Dental</span>
    </span>
  );
}
