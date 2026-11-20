"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

type StaggerRevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** "rise" = 3D tilt-up from below, "flip" = rotateY swing-in, "fade" = soft fade-up. */
  variant?: "rise" | "flip" | "fade";
  stagger?: number;
};

/**
 * Staggered 3D entrance for every `[data-stagger]` descendant. Uses ScrollTrigger.batch so items
 * that enter together animate together (rows on desktop, one-by-one on a single phone column).
 */
export function StaggerReveal({ as: Tag = "div", children, className, variant = "rise", stagger = 0.1 }: StaggerRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-stagger]", ref.current);
      if (!items.length) return;
      const mm = gsap.matchMedia();

      mm.add({ isDesktop: MQ.desktop, isMobile: MQ.mobile }, (ctx) => {
        const { isDesktop } = ctx.conditions as { isDesktop: boolean };
        const k = isDesktop ? 1 : 0.6; // gentler depth on small screens
        // opacity (not autoAlpha/visibility): items not yet revealed must stay keyboard-focusable.
        const from =
          variant === "flip"
            ? { opacity: 0, rotateY: -35 * k, x: 60 * k, z: -120 * k, transformOrigin: "0% 50%" }
            : variant === "fade"
              ? { opacity: 0, y: 40 * k }
              : { opacity: 0, y: 90 * k, rotateX: -32 * k, z: -160 * k, transformOrigin: "50% 100%" };

        gsap.set(items, { ...from, visibility: "visible", transformPerspective: 1100 });
        ScrollTrigger.batch(items, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              x: 0,
              y: 0,
              z: 0,
              rotateX: 0,
              rotateY: 0,
              duration: isDesktop ? 1.25 : 1,
              ease: "reveal",
              stagger,
              overwrite: true,
              clearProps: "transform", // hand the element back to CSS / hover effects
            }),
        });
      });
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
