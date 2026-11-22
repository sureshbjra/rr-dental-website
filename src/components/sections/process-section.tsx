"use client";

import { useRef } from "react";
import { TextReveal } from "@/components/animations/text-reveal";
import { processSteps } from "@/config/content";
import { asset } from "@/lib/asset";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * Stacking cards. Each card is `position: sticky` (native, so it behaves on iOS / Android), and as the
 * next card slides over it GSAP pushes it back in 3D — scaled down, tipped away and dimmed.
 * Styled in the Oravie palette: night navy, cyan accents and glowing glass cards, with the same tooth
 * icons and pedestal rings as the Dental Care Journey panel in the hero.
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
            .to(shade, { opacity: 0.18, ease: "none" }, 0);
        });
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      id="journey"
      className="relative z-10 border-t border-[rgb(72_205_255/0.25)] text-white"
      style={{ background: SECTION_BG }}
    >
      <div className="shell section-y">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 lg:pr-10">
            <div className="lg:sticky lg:top-36">
              <p className="font-ui text-caption tracking-[0.32em] text-[#22c6f6]">STEP BY STEP</p>
              <TextReveal as="h2" className="mt-4 max-w-[14ch] text-[clamp(2.2rem,4.2vw,3.6rem)] leading-[1] font-extrabold tracking-[-0.03em] text-white">
                Your Dental <span className="text-[#22c6f6] [text-shadow:0_0_24px_rgb(34_198_246/0.35)]">Care Journey</span>
              </TextReveal>
              <TextReveal as="p" delay={0.12} className="text-lead mt-6 max-w-[32ch] text-white/75">
                Thoughtful care, from your first scan to a restored smile.
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
                  className="relative overflow-hidden rounded-[1.75rem] border border-[rgb(120_215_255/0.45)] p-7 shadow-[0_0_34px_rgb(56_189_248/0.22),0_24px_50px_-20px_rgb(0_8_24/0.9),inset_0_1px_0_rgb(255_255_255/0.25),inset_0_0_30px_rgb(90_200_255/0.12)] will-change-transform sm:p-10 lg:p-12"
                  style={{ background: STEP_TINTS[i] ?? STEP_TINTS[0] }}
                >
                  <div data-step-shade aria-hidden className="pointer-events-none absolute inset-0 bg-[#020c1e] opacity-0" />
                  {/* Phones: number and tooth side by side, text below. Wider: number · text · tooth. */}
                  <div className="relative grid grid-cols-[auto_1fr] gap-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-10">
                    <p aria-hidden className="tabular self-start text-[clamp(3.5rem,7vw,6rem)] leading-[0.85] font-extrabold tracking-[-0.05em] text-[#22c6f6] [text-shadow:0_0_28px_rgb(34_198_246/0.45)]">
                      {i + 1}
                    </p>
                    <div className="col-span-2 sm:col-span-1 sm:pt-2">
                      <h3 className="text-display-m font-bold text-white">
                        <span className="sr-only">Step {i + 1}: </span>
                        {step.title}
                      </h3>
                      <p className="mt-4 max-w-[42ch] text-white/75">{step.text}</p>
                    </div>
                    <StepIcon index={i} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const SECTION_BG = [
  "radial-gradient(ellipse 45% 35% at 85% 20%, rgb(34 140 255 / 0.18), transparent 70%)",
  "radial-gradient(ellipse 40% 40% at 10% 80%, rgb(34 198 246 / 0.1), transparent 70%)",
  "linear-gradient(180deg, #041733 0%, #06204a 100%)",
].join(", ");

/* Glass cards, a little brighter for each step (the journey moves towards the restored smile). */
const STEP_TINTS = [
  "radial-gradient(ellipse 70% 60% at 20% 0%, rgb(160 220 255 / 0.16), transparent 70%), linear-gradient(150deg, #0d3a6e 0%, #0a2b55 55%, #071f42 100%)",
  "radial-gradient(ellipse 70% 60% at 20% 0%, rgb(160 220 255 / 0.18), transparent 70%), linear-gradient(150deg, #0f4178 0%, #0b305d 55%, #082247 100%)",
  "radial-gradient(ellipse 70% 60% at 20% 0%, rgb(160 220 255 / 0.2), transparent 70%), linear-gradient(150deg, #114882 0%, #0c3565 55%, #09264d 100%)",
  "radial-gradient(ellipse 70% 60% at 20% 0%, rgb(160 220 255 / 0.22), transparent 70%), linear-gradient(150deg, #134f8c 0%, #0e3a6d 55%, #0a2a53 100%)",
];

const STEP_ICONS = ["tooth", "decay", "section", "tooth2"];

/** The step's tooth on a glowing pedestal ring — the same pictures as the hero's journey panel. */
function StepIcon({ index }: { index: number }) {
  const name = STEP_ICONS[index];
  if (!name) return null;
  return (
    <div aria-hidden className="relative col-start-2 row-start-1 mr-2 mb-3 flex h-24 w-28 shrink-0 items-end justify-center justify-self-end sm:col-start-auto sm:row-start-auto sm:mr-0 sm:mb-0 sm:justify-self-auto lg:h-28 lg:w-32">
      <span className="absolute bottom-0 left-1/2 h-6 w-28 -translate-x-1/2 translate-y-1/2 rounded-[50%] border-2 border-[rgb(80_210_255/0.95)] [background:radial-gradient(ellipse_at_50%_50%,rgb(56_189_248/0.55),rgb(20_90_180/0.2)_55%,transparent_72%)] shadow-[0_0_18px_rgb(56_189_248/0.75),inset_0_0_12px_rgb(120_220_255/0.6)] lg:w-32" />
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-rendered icon */}
      <img
        src={asset(`/images/oravie/${name}.webp`)}
        alt=""
        draggable={false}
        className="relative h-full w-auto [filter:drop-shadow(0_6px_12px_rgb(0_16_40/0.55))_drop-shadow(0_0_12px_rgb(56_189_248/0.3))]"
      />
    </div>
  );
}
