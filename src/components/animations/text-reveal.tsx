"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, MQ, SplitText, useGSAP } from "@/lib/gsap";
import { enterDelay } from "@/lib/scroll-state";

type TextRevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Unit that slides up out of its line mask. */
  type?: "lines" | "words" | "chars";
  /** "scroll" = when it enters the viewport, "load" = on mount (waits for page transitions). */
  trigger?: "scroll" | "load";
  delay?: number;
  stagger?: number;
  start?: string;
  id?: string;
};

/**
 * Masked text reveal (SplitText). Lines / words / chars rise out of clipped line masks.
 * `autoSplit` re-splits on resize and font load, carrying the animation's progress over,
 * so line breaks stay correct on rotation and on slow font loads.
 *
 * Accessibility: lines and words keep their text in the accessibility tree (`aria: "none"`) — the
 * default would set aria-label on the element (prohibited on <p>/<span>/<div>) and hide the pieces.
 * Chars use the default (label + hidden letters) so screen readers don't spell words out; only use
 * chars on headings or inside aria-hidden decoration.
 */
export function TextReveal({
  as: Tag = "div",
  children,
  className,
  type = "lines",
  trigger = "scroll",
  delay = 0,
  stagger,
  start = "top 88%",
  id,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const split = SplitText.create(el, {
          type: type === "lines" ? "lines" : type === "words" ? "lines,words" : "lines,words,chars",
          aria: type === "chars" ? "auto" : "none",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            const targets = type === "lines" ? self.lines : type === "words" ? self.words : self.chars;
            return gsap.from(targets, {
              yPercent: 120,
              rotate: type === "chars" ? 0 : 3,
              transformOrigin: "0% 100%",
              duration: type === "chars" ? 0.9 : 1.15,
              ease: "reveal",
              stagger: stagger ?? (type === "chars" ? 0.025 : type === "words" ? 0.045 : 0.1),
              delay: trigger === "load" ? enterDelay(delay) : delay,
              scrollTrigger: trigger === "scroll" ? { trigger: el, start, once: true } : undefined,
            });
          },
        });
        gsap.set(el, { visibility: "visible" });
        return () => split.revert();
      });
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} id={id} data-animate className={className}>
      {children}
    </Tag>
  );
}
