"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Reveals its content top-to-bottom behind the site's cyan scan line when it scrolls into view —
 * used on the "after" photo, so the result is uncovered the way a scan builds an image.
 * Reduced motion (or no JS): the content is simply shown.
 */
export function ScanReveal({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const target = el.querySelector<HTMLElement>("[data-scan-target]");
      const line = el.querySelector<HTMLElement>("[data-scan-line]");
      if (!target || !line) return;

      gsap.matchMedia().add(MQ.motion, () => {
        gsap
          .timeline({
            scrollTrigger: { trigger: el, start: "top 78%", once: true },
            defaults: { ease: "cinematic", duration: 1.5 },
          })
          .fromTo(target, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)" }, 0)
          .fromTo(line, { y: 0, opacity: 1 }, { y: () => target.offsetHeight, opacity: 1 }, 0)
          .to(line, { opacity: 0, duration: 0.45, ease: "none" }, ">-0.15");
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className={cn("relative", className)}>
      <div data-scan-target>{children}</div>
      <span
        data-scan-line
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan opacity-0 shadow-[0_0_18px_4px_rgb(56_189_248/0.6)]"
      />
    </div>
  );
}
