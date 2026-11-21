"use client";

import { useRef } from "react";
import { preload } from "react-dom";
import { asset } from "@/lib/asset";
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
      const [backdrop] = q("[data-hero-backdrop]") as HTMLElement[];
      const [glow] = q("[data-hero-glow]") as HTMLElement[];
      const orbitRings = q("[data-hero-orbit]") as HTMLElement[];
      const treatmentCards = q("[data-hero-treatment]") as HTMLElement[];
      const [eyebrow] = q("[data-hero-eyebrow]") as HTMLElement[];
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
        gsap.set(backdrop, { yPercent: s * 5, scale: 1 + s * 0.035 });
        gsap.set(glow, { opacity: 0.18 + s * 0.24, scale: 1 + s * 0.14 });
        treatmentCards.forEach((card, i) => {
          const direction = i % 2 === 0 ? 1 : -1;
          card.style.setProperty("translate", `${direction * s * (14 + i * 3)}px ${direction * s * (8 + i * 5)}px`);
        });
      };

      const mm = gsap.matchMedia();
      mm.add({ isDesktop: MQ.desktop, isTall: MQ.mobileTall, isShort: MQ.mobileShort }, (ctx) => {
        const { isDesktop, isShort } = ctx.conditions as { isDesktop: boolean; isShort: boolean };
        const d = enterDelay(0.15);

        // Slow counter-rotation gives the tooth a living, instrument-like frame without competing
        // with the scroll-controlled model animation.
        gsap.to(orbitRings[0], { rotation: 360, duration: 52, ease: "none", repeat: -1 });
        gsap.to(orbitRings[1], { rotation: -360, duration: 68, ease: "none", repeat: -1 });

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
        gsap.set([eyebrow, title, text], { visibility: "visible" });
        // The poster/canvas isn't faded in: it must paint immediately (it's the LCP element).
        // opacity, not visibility, so the links stay keyboard-focusable while they're revealing.
        gsap
          .timeline({ delay: d, defaults: { ease: "reveal" } })
          .fromTo(eyebrow, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9 }, 0.25)
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
            onUpdate: (self) => {
              setScan(self.progress);
              // The scan and the exit turn form one continuous 3D movement.
              scrollState.hero.progress = self.progress * 0.5;
            },
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
                onUpdate: (self) => (scrollState.hero.progress = 0.5 + self.progress * 0.5),
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
              scrollState.hero.progress = self.progress * 0.5;
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
        treatmentCards.forEach((card) => card.style.removeProperty("translate"));
      };
    },
    { scope: root },
  );

  // The outer <div> is deliberate: the <section> gets pinned (GSAP wraps it in a pin-spacer), and React
  // must never use a pinned node as a sibling reference when it inserts the next page.
  return (
    <div>
      <section ref={root} className="relative isolate overflow-x-clip tall:h-svh lg:h-svh">
        {/* Existing clinic photography, pushed into the background so the tooth stays the hero. */}
        <div data-hero-backdrop aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
          <div
            className="hero-clinic-photo absolute -inset-4"
            style={{ backgroundImage: `url("${asset("/images/clinic-concept.webp")}")` }}
          />
          <div className="hero-clinic-vignette absolute inset-0" />
        </div>
        {/* Key light behind the specimen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(46rem_38rem_at_74%_46%,rgb(56_189_248/0.16),transparent_62%),radial-gradient(60rem_40rem_at_10%_110%,rgb(11_49_89/0.9),transparent_70%)]"
        />
        <div
          data-hero-glow
          aria-hidden="true"
          className="pointer-events-none absolute left-[56%] top-[18%] -z-10 h-[68%] w-[48%] rounded-full bg-cyan/15 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgb(167_221_255/0.16)_1px,transparent_1px),linear-gradient(90deg,rgb(167_221_255/0.16)_1px,transparent_1px)] [background-size:5rem_5rem] [mask-image:radial-gradient(ellipse_at_72%_44%,black,transparent_72%)]"
        />

        {/* Tall phones: one full screen (title, tooth filling the middle, copy at the bottom) so it can pin. */}
        <div className="shell relative flex min-h-svh flex-col pt-28 pb-10 tall:h-full tall:min-h-0 tall:pt-[5.25rem] tall:pb-5 lg:h-full lg:min-h-0 lg:pt-36 lg:pb-12">
          <div data-hero-copy className="relative z-0">
            <p data-hero-eyebrow data-animate className="font-ui mb-5 flex items-center gap-3 text-[0.68rem] font-medium tracking-[0.24em] text-ice/75 lg:mb-7">
              <span aria-hidden="true" className="h-px w-8 bg-cyan shadow-[0_0_12px_rgb(56_189_248/0.8)]" />
              RR DENTAL HOSPITAL <span className="text-cyan/70">·</span> DIGITAL PRECISION
            </p>
            <h1
              data-hero-title
              data-animate
              className="hero-title font-display text-display-xl tall:text-[min(11.4vw,4rem)] lg:text-display-hero block text-mist lg:max-w-[72%]"
            >
              {heroContent.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
          </div>

          <div
            data-hero-visual
            role="img"
            aria-label="3D model of a lower molar. Scrolling passes a scanner through it to show the pulp inside."
            className="relative z-10 -mx-[var(--gutter)] mt-4 h-[min(112vw,34rem)] tall:mt-1 tall:flex tall:h-auto tall:min-h-0 tall:flex-1 tall:flex-col lg:pointer-events-none lg:absolute lg:inset-y-0 lg:right-[-7vw] lg:mx-0 lg:mt-0 lg:h-auto lg:w-[52%]"
          >
            <div aria-hidden="true" className="hero-tooth-glow absolute left-1/2 top-1/2 z-0" />
            <div aria-hidden="true" className="hero-orbit-position hero-orbit-position--outer absolute left-1/2 top-1/2 z-0">
              <div data-hero-orbit className="hero-orbit-surface hero-orbit-surface--outer" />
            </div>
            <div aria-hidden="true" className="hero-orbit-position hero-orbit-position--inner absolute left-1/2 top-1/2 z-0">
              <div data-hero-orbit className="hero-orbit-surface hero-orbit-surface--inner" />
            </div>
            <div data-hero-scene className="relative size-full tall:min-h-0 tall:flex-1">
              <ThreeDSceneLoader />
            </div>
            <div data-hero-treatment aria-hidden="true" className="glass hero-float absolute left-[-12%] top-[39%] z-20 hidden w-52 rounded-2xl p-4 lg:block">
              <span className="font-ui text-caption flex items-center gap-2 text-ice"><span className="size-2 rounded-full bg-cyan shadow-[0_0_14px_rgb(56_189_248/0.9)]" /> 3D smile preview</span>
              <span className="mt-1 block text-xs text-mist/60">See your plan take shape</span>
            </div>
            <div data-hero-treatment aria-hidden="true" className="glass hero-float absolute right-[-3%] top-[58%] z-20 hidden w-48 rounded-2xl p-4 [animation-delay:-3.4s] lg:block">
              <span className="font-ui text-caption flex items-center gap-2 text-ice"><span className="flex size-6 items-center justify-center rounded-full bg-mist/15 text-cyan">✳</span> Gentle dentistry</span>
              <span className="mt-1 block text-xs text-mist/60">Thoughtful at every step</span>
            </div>
            <div data-hero-treatment aria-hidden="true" className="glass hero-float absolute right-[8%] top-[24%] z-20 hidden w-48 rounded-2xl p-4 [animation-delay:-1.7s] lg:block">
              <span className="font-ui text-caption flex items-center gap-2 text-ice"><span className="size-2 rounded-full bg-ice shadow-[0_0_12px_rgb(221_244_255/0.8)]" /> Digital precision</span>
              <span className="mt-1 block text-xs text-mist/60">Care, built around you</span>
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
        <div aria-hidden="true" className="font-ui absolute bottom-8 left-[var(--gutter)] hidden items-center gap-3 text-xs tracking-[0.18em] text-mist/45 lg:flex">
          <span className="block h-10 w-px origin-top bg-gradient-to-b from-cyan to-transparent" />
          <span>SCROLL TO EXPLORE</span>
        </div>
      </section>
    </div>
  );
}
