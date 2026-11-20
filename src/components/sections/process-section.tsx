"use client";

import { useRef } from "react";
import { TextReveal } from "@/components/animations/text-reveal";
import { processSteps } from "@/config/content";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * Stacking cards. Each card is `position: sticky` (native, so it behaves on iOS / Android), and as the
 * next card slides over it GSAP pushes it back in 3D — scaled down, tipped away and dimmed.
 */
export function ProcessSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-step]", root.current);
      const mm = gsap.matchMedia();
      mm.add({ isDesktop: MQ.desktop, isMobile: MQ.mobile }, (ctx) => {
        const { isDesktop } = ctx.conditions as { isDesktop: boolean };
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          const inner = card.querySelector("[data-step-inner]");
          const shade = card.querySelector("[data-step-shade]");
          // Entrance on the sticky <li>; the scrubbed push-back below drives the inner card (no shared props).
          gsap.from(card, {
            y: isDesktop ? 120 : 70,
            rotateX: isDesktop ? -18 : -10,
            transformPerspective: 1000,
            transformOrigin: "50% 0%",
            duration: 1.1,
            ease: "reveal",
            scrollTrigger: { trigger: card, start: "top 92%", once: true },
          });
          if (!next) return;
          const depth = cards.length - i;
          gsap
            .timeline({
              scrollTrigger: {
                trigger: next,
                start: "top bottom",
                end: () => `top ${parseFloat(getComputedStyle(next).top) + 10}px`,
                scrub: true,
                invalidateOnRefresh: true,
              },
            })
            .to(inner, { scale: 1 - depth * (isDesktop ? 0.035 : 0.03), rotateX: isDesktop ? 8 : 5, transformPerspective: 1000, transformOrigin: "50% 0%", ease: "none" }, 0)
            .to(shade, { opacity: 0.55, ease: "none" }, 0);
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="shell section-y relative">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5 lg:pr-10">
          <div className="lg:sticky lg:top-36">
            <TextReveal as="h2" className="font-display text-display-s max-w-[14ch]">
              What happens when you visit
            </TextReveal>
            <TextReveal as="p" delay={0.12} className="text-lead mt-6 max-w-[32ch] text-mist/65">
              Four steps, and you&apos;ll always know which one you&apos;re on.
            </TextReveal>
          </div>
        </div>

        <ol className="relative pb-[6vh] lg:col-span-7">
          {processSteps.map((step, i) => (
            <li
              key={step.title}
              data-step
              className="sticky mb-[12vh] last:mb-0"
              style={{ top: `calc(clamp(5.5rem, 13vh, 8.5rem) + ${i * 1.1}rem)` }}
            >
              <div
                data-step-inner
                className="relative overflow-hidden rounded-[1.75rem] border border-mist/[0.1] p-7 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(239_248_255/0.07)] will-change-transform sm:p-10 lg:p-12"
                style={{ background: `linear-gradient(160deg, ${STEP_TINTS[i] ?? STEP_TINTS[0]} 0%, #081d38 100%)` }}
              >
                <div data-step-shade aria-hidden className="pointer-events-none absolute inset-0 bg-navy opacity-0" />
                <div className="relative grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
                  <p aria-hidden className="font-display tabular text-[clamp(3.5rem,7vw,6rem)] leading-[0.85] tracking-[-0.05em] text-cyan">
                    {i + 1}
                  </p>
                  <div className="sm:pt-2">
                    <h3 className="font-display text-display-m">
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-[42ch] text-mist/70">{step.text}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const STEP_TINTS = ["#0d3561", "#103d6d", "#13457a", "#164e88"];
