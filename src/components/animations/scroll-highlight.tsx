"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MQ, SplitText, useGSAP } from "@/lib/gsap";

/**
 * Scroll-scrubbed reading highlight: words light up one by one as the paragraph moves through
 * the viewport. Fully reversible; on mobile the scrub window is shorter so it completes on screen.
 */
export function ScrollHighlight({
  children,
  className,
  dim = { opacity: 0.16, color: "#a7ddff" },
  lit = { opacity: 1, color: "#eff8ff" },
}: {
  children: ReactNode;
  className?: string;
  dim?: { opacity: number; color: string };
  lit?: { opacity: number; color: string };
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add({ isDesktop: MQ.desktop, isMobile: MQ.mobile }, (ctx) => {
        const { isDesktop } = ctx.conditions as { isDesktop: boolean };
        const split = SplitText.create(el, {
          type: "words",
          aria: "none", // keep the sentence readable by screen readers
          autoSplit: true,
          onSplit(self) {
            return gsap.fromTo(
              self.words,
              { opacity: dim.opacity, color: dim.color },
              {
                opacity: lit.opacity,
                color: lit.color,
                ease: "none",
                stagger: 0.1,
                scrollTrigger: {
                  trigger: el,
                  // Fully lit by the time the paragraph's bottom reaches ~70% of the viewport, i.e. while
                  // it is still in the reading zone.
                  start: isDesktop ? "top 85%" : "top 90%",
                  end: isDesktop ? "bottom 70%" : "bottom 75%",
                  scrub: 0.6,
                },
              }
            );
          },
        });
        return () => split.revert();
      });
    },
    { scope: ref }
  );

  return (
    <p ref={ref} className={className}>
      {children}
    </p>
  );
}
