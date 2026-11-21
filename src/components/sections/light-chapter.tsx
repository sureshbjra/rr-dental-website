"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * The clinic chapter: a Mist sheet that rises over the scan room. Its rounded, inset top opens to
 * full width as it arrives, and the nav switches to navy while the sheet is underneath it.
 */
export function LightChapter({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const sheet = root.current;
      if (!sheet) return;
      const header = document.querySelector("header");

      ScrollTrigger.create({
        trigger: sheet,
        start: "top 36px",
        end: "bottom 36px",
        onToggle: (self) => header?.toggleAttribute("data-light", self.isActive),
      });

      const mm = gsap.matchMedia();
      mm.add({ isDesktop: MQ.desktop, isMobile: MQ.mobile }, (ctx) => {
        const { isDesktop } = ctx.conditions as { isDesktop: boolean };
        gsap.fromTo(
          sheet,
          { clipPath: isDesktop ? "inset(0% 5% 0% 5% round 56px 56px 0px 0px)" : "inset(0% 3% 0% 3% round 28px 28px 0px 0px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)",
            ease: "none",
            scrollTrigger: { trigger: sheet, start: "top bottom", end: "top 12%", scrub: true },
          }
        );
      });

      return () => header?.removeAttribute("data-light");
    },
    { scope: root }
  );

  return (
    <section id="about" ref={root} className="relative z-10 bg-mist text-navy [--muted-foreground:rgb(7_27_53/0.62)]">
      {children}
    </section>
  );
}
