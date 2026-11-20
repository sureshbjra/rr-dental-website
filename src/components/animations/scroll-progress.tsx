"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";

/** Hairline reading-progress bar across the top of the viewport. Rebuilt per route. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      gsap.fromTo(
        ref.current,
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } }
      );
    },
    { dependencies: [pathname], revertOnUpdate: true }
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-cyan via-ice to-cyan shadow-[0_0_12px_rgb(56_189_248/0.8)]"
    />
  );
}
