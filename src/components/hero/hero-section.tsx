"use client";

import { useRef } from "react";
import { preload } from "react-dom";
import { Button, Roll } from "@/components/ui/button";
import { Magnetic } from "@/components/animations/magnetic";
import { TransitionLink } from "@/components/animations/transition-link";
import { ThreeDSceneLoader } from "@/components/three/scene-loader";
import { TOOTH_MODEL_URL } from "@/config/models";
import { heroContent } from "@/config/content";
import { gsap, MQ, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { enterDelay, SCAN_REACH, scanDepth, scrollState, TOOTH_HEIGHT_MM } from "@/lib/scroll-state";

/**
 * The scan room. A huge expanded headline with the 3D molar layered over its right edge.
 * Scrolling runs one scan pass: a scanner ring descends through the tooth (cut face + glowing pulp
 * below, point cloud above) and returns. Desktop pins for the pass; phones scan in place.
 * The glass readout is the scroll prompt, then the live section depth.
 */
export function HeroSection() {
  // Start downloading the GLB with the HTML, in parallel with the 3D JS chunk.
  preload(TOOTH_MODEL_URL, { as: "fetch", crossOrigin: "anonymous", type: "model/gltf-binary" });
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const [title] = q("[data-hero-title]") as HTMLElement[];
      const [text] = q("[data-hero-text]") as HTMLElement[];
      const [visual] = q("[data-hero-visual]") as HTMLElement[];
      // Two readouts: in the copy row (desktop, short phones) and on the tooth (tall phones).
      const values = q("[data-readout-value]") as HTMLElement[];
      const bars = q("[data-readout-bar]") as HTMLElement[];

      const setScan = (s: number) => {
        scrollState.hero.scan = s;
        const d = scanDepth(s);
        const mm = d * SCAN_REACH * TOOTH_HEIGHT_MM;
        const label = d > 0.002 ? `Section at ${mm.toFixed(1)} mm` : "Scroll to scan";
        values.forEach((v) => (v.textContent = label));
        bars.forEach((b) => (b.style.transform = `scaleX(${d})`));
      };

      const mm = gsap.matchMedia();
      mm.add({ isDesktop: MQ.desktop, isTall: MQ.mobileTall, isShort: MQ.mobileShort }, (ctx) => {
        const { isDesktop, isShort } = ctx.conditions as { isDesktop: boolean; isShort: boolean };
        const d = enterDelay(0.15);

        // ------------------------------------------------------------ intro: one orchestrated moment
        // aria: "none" keeps the real text readable by screen readers (the default would put an
        // aria-label on a <span>/<p>, where it's prohibited, and hide the lines).
        SplitText.create(title, {
          type: "lines",
          aria: "none",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, { yPercent: 105, duration: 1.5, ease: "reveal", stagger: 0.12, delay: d }),
        });
        SplitText.create(text, {
          type: "lines",
          aria: "none",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, { yPercent: 105, duration: 1.2, ease: "reveal", stagger: 0.06, delay: d + 0.55 }),
        });
        gsap.set([title, text], { visibility: "visible" });
        // The poster/canvas isn't faded in: it must paint immediately (it's the LCP element).
        // opacity, not visibility, so the links stay keyboard-focusable while they're revealing.
        gsap
          .timeline({ delay: d, defaults: { ease: "reveal" } })
          .fromTo(q("[data-hero-action]"), { opacity: 0, visibility: "visible", y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.8)
          .fromTo(q("[data-hero-readout]"), { opacity: 0, visibility: "visible", y: 24 }, { opacity: 1, y: 0, duration: 1 }, 1.0);

        // ------------------------------------------------------------ the scan pass
        // Desktop and tall phones: the whole hero holds while the scanner passes through the tooth.
        if (!isShort) {
          const pinST = ScrollTrigger.create({
            trigger: root.current,
            start: "top top",
            end: isDesktop ? "+=95%" : "+=110%", // a little more travel for a thumb
            pin: true,
            scrub: true,
            anticipatePin: 1,
            onUpdate: (self) => setScan(self.progress),
          });
          // After the pass: the copy lifts away and the tooth turns as the hero leaves.
          gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: root.current,
                start: () => pinST.end,
                end: () => pinST.end + window.innerHeight,
                scrub: 0.6,
                invalidateOnRefresh: true,
                onUpdate: (self) => (scrollState.hero.progress = self.progress),
              },
            })
            .to(q("[data-hero-copy]"), { yPercent: -30, opacity: 0 }, 0)
            .to(visual, { yPercent: isDesktop ? 14 : 8, scale: 0.9 }, 0);
        } else {
          // Short / landscape phones (no room for a full-screen scene): the pass runs from the first
          // scroll and completes while the tooth is still fully visible (its bottom at 35% of the viewport).
          ScrollTrigger.create({
            start: 0,
            end: () => visual.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.35,
            invalidateOnRefresh: true,
            scrub: true,
            onUpdate: (self) => {
              setScan(self.progress);
              scrollState.hero.progress = Math.max(0, (self.progress - 0.75) / 0.25);
            },
          });
        }
      });

      // Reduced motion: no scan pass, so the readout shouldn't invite one.
      mm.add(MQ.reduce, () => {
        values.forEach((v) => (v.textContent = "Shown in 3D"));
      });

      return () => {
        scrollState.hero.scan = 0;
        scrollState.hero.progress = 0;
      };
    },
    { scope: root },
  );

  // The outer <div> is deliberate: the <section> gets pinned (GSAP wraps it in a pin-spacer), and React
  // must never use a pinned node as a sibling reference when it inserts the next page.
  return (
    <div>
      <section ref={root} className="relative isolate overflow-x-clip tall:h-svh lg:h-svh">
        {/* Key light behind the specimen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(46rem_38rem_at_74%_46%,rgb(56_189_248/0.16),transparent_62%),radial-gradient(60rem_40rem_at_10%_110%,rgb(11_49_89/0.9),transparent_70%)]"
        />

        {/* Tall phones: one full screen (title, tooth filling the middle, copy at the bottom) so it can pin. */}
        <div className="shell relative flex min-h-svh flex-col pt-28 pb-10 tall:h-full tall:min-h-0 tall:pt-[5.25rem] tall:pb-5 lg:h-full lg:min-h-0 lg:pt-36 lg:pb-12">
          <h1 data-hero-copy className="relative z-0">
            <span
              data-hero-title
              data-animate
              className="font-display text-display-xl tall:text-[min(11.4vw,4rem)] lg:text-display-hero block text-mist"
            >
              {heroContent.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </span>
          </h1>

          <div
            data-hero-visual
            role="img"
            aria-label="3D model of a lower molar. Scrolling passes a scanner through it to show the pulp inside."
            className="relative z-10 -mx-[var(--gutter)] mt-4 h-[min(112vw,34rem)] tall:mt-1 tall:flex tall:h-auto tall:min-h-0 tall:flex-1 tall:flex-col lg:pointer-events-none lg:absolute lg:inset-y-0 lg:right-[-7vw] lg:mx-0 lg:mt-0 lg:h-auto lg:w-[52%]"
          >
            <div data-hero-scene className="relative size-full tall:min-h-0 tall:flex-1">
              <ThreeDSceneLoader />
            </div>
            {/* Tall phones: the readout becomes a slim instrument strip under the specimen */}
            <div data-hero-readout data-animate className="hidden px-[var(--gutter)] pt-1 tall:block">
              <div className="text-caption flex items-baseline justify-between gap-4">
                <span className="text-mist/55">{heroContent.specimen}</span>
                <span data-readout-value className="font-ui tabular text-mist">
                  Scroll to scan
                </span>
              </div>
              <div className="mt-2 h-px bg-mist/15">
                <div data-readout-bar className="h-full origin-left bg-cyan" style={{ transform: "scaleX(0)" }} />
              </div>
            </div>
          </div>

          <div data-hero-copy className="relative z-20 mt-auto grid gap-8 pt-6 tall:gap-5 tall:pt-3 lg:grid-cols-12 lg:items-end lg:gap-6">
            <p data-hero-text data-animate className="text-lead tall:text-base max-w-[34ch] text-mist/75 lg:col-span-5">
              {heroContent.text}
            </p>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4 tall:gap-x-4 lg:col-span-4">
              <div data-hero-action data-animate>
                <Magnetic>
                  <Button asChild size="lg" className="tall:h-12 tall:px-5 tall:text-sm">
                    <TransitionLink href="/appointment">
                      <Roll>{heroContent.primary}</Roll>
                    </TransitionLink>
                  </Button>
                </Magnetic>
              </div>
              <div data-hero-action data-animate>
                <Button asChild variant="link" className="text-mist tall:text-sm">
                  <TransitionLink href="/treatments">{heroContent.secondary}</TransitionLink>
                </Button>
              </div>
            </div>

            {/* Live scan readout — the scroll prompt, then the section depth */}
            <div data-hero-readout data-animate className="tall:hidden lg:col-span-3 lg:justify-self-end">
              <div className="glass w-full min-w-[15rem] rounded-2xl px-5 py-4 lg:w-[17rem]" aria-live="off">
                <p className="text-caption text-mist/55">{heroContent.specimen}</p>
                <p data-readout-value className="font-ui tabular mt-1 text-[0.95rem] text-mist">
                  Scroll to scan
                </p>
                <div className="mt-3 h-px bg-mist/15">
                  <div data-readout-bar className="h-full origin-left bg-cyan" style={{ transform: "scaleX(0)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
