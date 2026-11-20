"use client";

import { useRef } from "react";
import { Button, Roll } from "@/components/ui/button";
import { Magnetic } from "@/components/animations/magnetic";
import { TextReveal } from "@/components/animations/text-reveal";
import { TransitionLink } from "@/components/animations/transition-link";
import { ctaContent } from "@/config/content";
import { phoneHref, siteConfig } from "@/config/site";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/**
 * The close: a rounded window opens to full-bleed as you scroll (clip-path) while the scanner rings
 * inside settle — the hero's motif, returning once. Desktop and tall phones pin for the reveal; short
 * or landscape phones scrub it in place.
 */
export function CtaSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MQ.desktop, () => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=90%",
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
            },
          })
          .fromTo(
            q("[data-cta-window]"),
            { clipPath: "inset(18% 22% 18% 22% round 56px)" },
            { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none" },
            0,
          )
          .fromTo(q("[data-cta-rings]"), { scale: 0.55, rotateX: 62 }, { scale: 1, rotateX: 72, ease: "none" }, 0);
      });

      mm.add(MQ.mobileTall, () => {
        gsap
          .timeline({
            scrollTrigger: { trigger: root.current, start: "top top", end: "+=75%", pin: true, scrub: 0.8, anticipatePin: 1 },
          })
          .fromTo(
            q("[data-cta-window]"),
            { clipPath: "inset(16% 7% 16% 7% round 32px)" },
            { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none" },
            0,
          )
          .fromTo(q("[data-cta-rings]"), { scale: 0.6, rotateX: 64 }, { scale: 1, rotateX: 72, ease: "none" }, 0);
      });

      mm.add(MQ.mobileShort, () => {
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top 95%", end: "top 15%", scrub: 0.5 } })
          .fromTo(
            q("[data-cta-window]"),
            { clipPath: "inset(8% 5% 8% 5% round 28px)" },
            { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none" },
            0,
          )
          .fromTo(q("[data-cta-rings]"), { scale: 0.7 }, { scale: 1, ease: "none" }, 0);
      });

      mm.add(MQ.motion, () => {
        gsap.from(q("[data-cta-action]"), {
          opacity: 0, // not autoAlpha: the buttons must stay keyboard-focusable before they reveal
          y: 24,
          stagger: 0.08,
          duration: 1,
          ease: "reveal",
          scrollTrigger: { trigger: q("[data-cta-actions]")[0], start: "top 92%", once: true },
        });
      });
    },
    { scope: root },
  );

  // Outer <div>: the <section> is pinned (wrapped in a pin-spacer); React needs a stable sibling node.
  return (
    <div>
      <section ref={root} className="relative h-svh min-h-[36rem]">
        <div data-cta-window className="absolute inset-0 overflow-hidden bg-ocean">
          <div
            aria-hidden
            className="absolute inset-0 [background:radial-gradient(70rem_36rem_at_50%_105%,rgb(56_189_248/0.32),transparent_60%)]"
          />
          {/* Scanner rings seen in perspective, centred under the headline */}
          <div aria-hidden className="absolute inset-x-0 bottom-[-18%] flex justify-center [perspective:900px]">
            <div data-cta-rings className="relative aspect-square w-[min(70rem,130vw)] [transform:rotateX(70deg)]">
              <div className="absolute inset-0 rounded-full border border-cyan/40 shadow-[0_0_40px_rgb(56_189_248/0.35)]" />
              <div className="absolute inset-[9%] rounded-full border border-ice/15" />
              <div className="absolute inset-[18%] rounded-full border border-ice/10" />
            </div>
          </div>

          <div className="shell relative flex h-full flex-col justify-center">
            <TextReveal as="h2" start="top 85%" className="font-display text-display-xl max-w-[12ch]">
              {ctaContent.title}
            </TextReveal>
            <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
              <TextReveal
                as="p"
                start="top 85%"
                delay={0.15}
                className="text-lead max-w-[36ch] text-mist/75 lg:col-span-5"
              >
                {ctaContent.text}
              </TextReveal>
              <div
                data-cta-actions
                className="flex flex-wrap items-center gap-x-7 gap-y-4 lg:col-span-6 lg:col-start-7 lg:justify-end"
              >
                <div data-cta-action>
                  <Magnetic>
                    <Button asChild size="lg">
                      <TransitionLink href="/appointment">
                        <Roll>{ctaContent.primary}</Roll>
                      </TransitionLink>
                    </Button>
                  </Magnetic>
                </div>
                <div data-cta-action>
                  <Button asChild variant="link" className="font-ui text-mist">
                    <a href={phoneHref}>Call {siteConfig.phone}</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
