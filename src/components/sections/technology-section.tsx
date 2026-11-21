"use client";

import { useRef } from "react";
import { TextReveal } from "@/components/animations/text-reveal";
import { TechDiagram } from "@/components/sections/tech-diagram";
import { technology } from "@/config/content";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * The lab. Desktop and tall phones: the section pins and the instrument panels travel horizontally,
 * each swinging in on a 3D Y-axis while its line diagram draws itself, then tipping away as it leaves.
 * Short / landscape phones: no pinning — panels stack and draw in as they scroll into view.
 * Reduced motion: the panels simply wrap into rows (the sideways layout exists only while it animates).
 */
export function TechnologySection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const [pinEl] = q("[data-tech-pin]") as HTMLElement[];
      const [track] = q("[data-tech-track]") as HTMLElement[];
      const panels = q("[data-tech-panel]") as HTMLElement[];
      const strokes = (panel: Element) => panel.querySelectorAll("[data-draw]");
      const mm = gsap.matchMedia();

      const horizontal = (isDesktop: boolean) => {
        const k = isDesktop ? 1 : 0.65; // gentler depth on a phone
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        // Phones: one panel fills the screen, so when scrolling stops the rail settles with the nearest
        // panel centred (progress values recomputed on every refresh / resize).
        let centres = [0];
        const measureCentres = () => {
          const d = distance();
          if (!d) return [0];
          const trackLeft = track.getBoundingClientRect().left - Number(gsap.getProperty(track, "x"));
          return panels.map((p) => {
            const left = trackLeft + p.offsetLeft - track.offsetLeft;
            return gsap.utils.clamp(0, 1, (left + p.offsetWidth / 2 - window.innerWidth / 2) / d);
          });
        };

        const move = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pinEl,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            ...(isDesktop
              ? {}
              : {
                  onRefresh: () => (centres = measureCentres()),
                  snap: { snapTo: (v: number) => gsap.utils.snap(centres, v), inertia: false, duration: { min: 0.25, max: 0.6 }, delay: 0.08, ease: "power2.inOut" },
                }),
          },
        });
        gsap.fromTo(q("[data-tech-rail]"), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: pinEl, start: "top top", end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true } });

        panels.forEach((panel) => {
          gsap.set(panel, { transformPerspective: 1400 });
          gsap
            .timeline({ scrollTrigger: { trigger: panel, containerAnimation: move, start: "left 100%", end: "left 50%", scrub: true } })
            .fromTo(panel, { rotateY: -30 * k, z: -200 * k, opacity: 0.2, transformOrigin: "0% 50%" }, { rotateY: 0, z: 0, opacity: 1, ease: "none" }, 0)
            .fromTo(strokes(panel), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", stagger: 0.02 }, 0.15);
          gsap.fromTo(
            panel.querySelector("[data-tech-inner]"),
            { rotateY: 0, z: 0, opacity: 1 },
            {
              rotateY: 22 * k,
              z: -140 * k,
              opacity: 0.3,
              transformOrigin: "100% 50%",
              transformPerspective: 1400,
              ease: "none",
              immediateRender: false,
              scrollTrigger: { trigger: panel, containerAnimation: move, start: "right 35%", end: "right 0%", scrub: true },
            }
          );
        });
      };

      mm.add(MQ.desktop, () => horizontal(true));
      mm.add(MQ.phonePin, () => horizontal(false));

      mm.add(MQ.phoneShort, () => {
        // opacity, not visibility: hidden-by-visibility text would also vanish for screen readers
        gsap.set(panels, { opacity: 0, rotateX: -24, y: 50, transformPerspective: 900, transformOrigin: "50% 0%" });
        panels.forEach((p) => gsap.set(strokes(p), { strokeDasharray: 1, strokeDashoffset: 1 }));
        ScrollTrigger.batch(panels, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            batch.forEach((p, i) =>
              gsap
                .timeline({ delay: i * 0.12 })
                .to(p, { opacity: 1, rotateX: 0, y: 0, duration: 1, ease: "reveal" })
                .to(strokes(p), { strokeDashoffset: 0, duration: 1.4, ease: "power2.out", stagger: 0.03 }, 0.2)
            ),
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} id="technology" className="relative bg-navy">
      <div
        data-tech-pin
        className="flex flex-col justify-center section-y lg:motion-safe:h-svh lg:motion-safe:overflow-hidden lg:motion-safe:py-[clamp(1.5rem,7svh,6rem)] phone:motion-safe:h-svh phone:motion-safe:overflow-hidden phone:motion-safe:py-[clamp(1rem,5svh,3rem)]"
      >
        {/* Desktop: heading on the left, the line and progress rail on the right (saves height so the
            whole pinned screen fits, with room above and below, even on short laptop screens). */}
        <div className="shell flex flex-col gap-8 phone:motion-safe:gap-[min(1.25rem,2.2svh)] lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <TextReveal as="h2" className="font-display text-display-l max-w-2xl phone:motion-safe:text-[length:min(10vw,6.2svh)] lg:motion-safe:text-[length:min(5.2vw,8svh,5.75rem)]">
            Precision powered by technology.
          </TextReveal>
          <div className="lg:w-[min(26rem,34vw)] lg:shrink-0 lg:pb-[0.4em]">
            <TextReveal as="p" delay={0.12} className="text-lead max-w-[38ch] text-mist/65 phone:motion-safe:text-[length:min(1.125rem,2.6svh)]">
              Each one replaces guesswork with a clear picture — for us, and for you.
            </TextReveal>
            <div aria-hidden className="mt-5 hidden h-px w-full bg-mist/15 phone:motion-safe:block phone:motion-safe:w-40 lg:motion-safe:block">
              <div data-tech-rail className="h-full origin-left bg-cyan shadow-[0_0_10px_rgb(56_189_248/0.8)]" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
        </div>

        <ul
          data-tech-track
          className={[
            "mt-12 flex flex-col gap-5 px-[var(--gutter)] will-change-transform",
            // desktop: one sideways rail while it animates; rows that wrap with reduced motion
            "lg:mt-16 lg:flex-row lg:flex-wrap lg:gap-7 lg:motion-safe:mt-[min(4rem,5svh)] lg:motion-reduce:mx-auto lg:motion-reduce:max-w-[96rem]",
            "lg:motion-safe:w-max lg:motion-safe:flex-nowrap lg:motion-safe:pr-[14vw] lg:motion-safe:pl-[max(var(--gutter),calc((100vw-96rem)/2+var(--gutter)))]",
            // tall phones: the same sideways rail
            "phone:motion-safe:mt-[min(2rem,3.4svh)] phone:motion-safe:w-max phone:motion-safe:flex-row phone:motion-safe:gap-4 phone:motion-safe:pr-[12vw]",
          ].join(" ")}
        >
          {technology.map((t) => (
            <li
              key={t.title}
              data-tech-panel
              className="phone:motion-safe:w-[min(82vw,24rem)] lg:motion-safe:w-[min(27rem,34vw)] lg:motion-reduce:w-[calc((100%-3.5rem)/3)]"
            >
              <article data-tech-inner className="panel flex h-full flex-col rounded-[1.75rem] p-7 phone:motion-safe:p-[min(1.5rem,3svh)] sm:p-8 lg:motion-safe:p-[min(2rem,3.4svh)]">
                <div className="relative overflow-hidden rounded-2xl border border-mist/[0.07] bg-navy/60 p-5 text-ice/70 phone:motion-safe:p-[min(1rem,2svh)] lg:motion-safe:p-[min(1.25rem,2.2svh)]">
                  <div aria-hidden className="absolute inset-0 [background:radial-gradient(18rem_12rem_at_50%_100%,rgb(56_189_248/0.12),transparent_70%)]" />
                  <TechDiagram
                    type={t.diagram}
                    className="relative mx-auto aspect-[5/4] w-full max-w-[18rem] phone:motion-safe:max-w-[min(12rem,20svh)] lg:motion-safe:max-w-[min(18rem,21svh)]"
                  />
                </div>
                <h3 className="font-display text-display-m mt-8 phone:motion-safe:mt-[min(1.25rem,2.4svh)] phone:motion-safe:text-[length:min(1.7rem,3.8svh)] lg:motion-safe:mt-[min(2rem,2.8svh)]">{t.title}</h3>
                <p className="mt-4 text-mist/65 phone:motion-safe:mt-[min(1rem,1.6svh)] phone:motion-safe:text-[length:min(1rem,2.4svh)] lg:motion-safe:mt-[min(1rem,1.8svh)]">{t.text}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
