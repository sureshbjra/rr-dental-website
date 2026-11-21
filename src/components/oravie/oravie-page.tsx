"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { TransitionLink } from "@/components/animations/transition-link";
import { Magnetic } from "@/components/animations/magnetic";
import { journeyStage, oravieState, resetOravieState } from "@/components/oravie/oravie-state";
import { asset } from "@/lib/asset";
import { gsap, MQ, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { enterDelay, getLenis } from "@/lib/scroll-state";
import { TreatmentsSection } from "@/components/treatments/treatments-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { ProcessSection } from "@/components/sections/process-section";
import { HospitalSection } from "@/components/sections/hospital-section";
import { GalleryPreview } from "@/components/sections/gallery-preview";
import { mainNav } from "@/config/site";

const ToothScene = dynamic(() => import("@/components/three/oravie-tooth-scene"), { ssr: false, loading: () => null });

/** The logo text: "RR Dental" with "Hospital" beneath it. */
const BRAND = { name: "RR Dental", sub: "Hospital" };

const NAV = [
  { label: "Home", href: "/", active: true },
  ...mainNav.map((item) => ({ ...item, href: item.href === "/technology" ? "#technology" : item.href, active: false })),
];

const icon = (name: string) => asset(`/images/oravie/${name}.webp`);

/*
 * Service cards. x / y: card centre on the desktop stage (the reference's 860 × 560 area around the
 * tooth); ry / rz: the card's 3D tilt; mx / my: the phone layout. wire: the glowing connector from
 * the card to the tooth, in stage pixels — [start, control, end].
 */
type Pt = [number, number];
type Service = {
  label: [string, string];
  icon: string;
  wide?: boolean;
  sparkles?: 1 | 2;
  wire: [Pt, Pt, Pt];
  x: string;
  y: string;
  ry: string;
  rz: string;
  mx: string;
  my: string;
};

const SERVICES: Service[] = [
  { label: ["Dental", "Implant"], icon: "implant", wire: [[214, 82], [262, 92], [302, 122]], x: "16.5%", y: "15.2%", ry: "26deg", rz: "13deg", mx: "14.2%", my: "15%" },
  { label: ["Braces &", "Alignment"], icon: "braces", wide: true, wire: [[248, 236], [276, 240], [304, 252]], x: "20.3%", y: "43%", ry: "24deg", rz: "8deg", mx: "14.2%", my: "43.5%" },
  { label: ["Teeth", "Cleaning"], icon: "tooth", sparkles: 1, wire: [[258, 364], [284, 352], [308, 338]], x: "21.5%", y: "69.6%", ry: "24deg", rz: "10deg", mx: "14.2%", my: "72%" },
  { label: ["Root", "Canal"], icon: "section", wire: [[650, 92], [612, 100], [572, 122]], x: "84%", y: "14.6%", ry: "-24deg", rz: "3deg", mx: "85.8%", my: "15%" },
  { label: ["Crowns &", "Bridges"], icon: "crown", wire: [[697, 228], [642, 232], [586, 246]], x: "89.5%", y: "40.7%", ry: "-24deg", rz: "8deg", mx: "85.8%", my: "43.5%" },
  { label: ["Teeth", "Whitening"], icon: "tooth2", sparkles: 2, wire: [[600, 352], [582, 346], [562, 336]], x: "77.9%", y: "66%", ry: "-24deg", rz: "9deg", mx: "85.8%", my: "72%" },
];

const STEPS = [
  { label: "Healthy Tooth", icon: "tooth", badge: "check" as const },
  { label: "Problem Identified", icon: "decay" },
  { label: "Treatment in Progress", icon: "section" },
  { label: "Restored Smile", icon: "tooth2", badge: "sparkles" as const },
];

/* ------------------------------------------------------------------ icons */

function ToothMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 52" className={className}>
      <defs>
        <linearGradient id="oravie-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7ff0ff" />
          <stop offset="0.5" stopColor="#25c6f6" />
          <stop offset="1" stopColor="#1670e8" />
        </linearGradient>
      </defs>
      <path
        d="M24 9C19 4.5 9 3.6 7 12.4c-1.5 6.8 2 12.6 4 18.6 1.6 4.8 1.4 16 5.6 16 4 0 3-10.4 7.4-12.4 4.4 2 3.4 12.4 7.4 12.4 4.2 0 4-11.2 5.6-16 2-6 5.5-11.8 4-18.6C39 3.6 29 4.5 24 9Z"
        fill="none"
        stroke="url(#oravie-mark)"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path d="M12.5 13.5c.8-3.4 4-5 7.5-4" fill="none" stroke="#c8f7ff" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

const CalendarIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <rect x="3" y="4.5" width="14" height="12.5" rx="2.4" />
    <path d="M3 8.5h14M7 2.8v3.4M13 2.8v3.4" />
    <path d="M7 11.6h1.4M10.3 11.6h1.4M7 14.2h1.4M10.3 14.2h1.4" strokeWidth="1.9" />
  </svg>
);

const ArrowIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />
  </svg>
);

const PlayIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2.6v10.8c0 .7.8 1.1 1.4.7l8.4-5.4c.5-.3.5-1.1 0-1.4L5.4 1.9C4.8 1.5 4 1.9 4 2.6Z" />
  </svg>
);

const Chevrons = () => (
  <svg aria-hidden="true" viewBox="0 0 36 30" className="ov-chevrons" data-o-chevron fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 5l10 10-10 10M18 5l10 10-10 10" />
  </svg>
);

function Sparkle({ style }: { style: CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="ov-sparkle" style={style} fill="currentColor">
      <path d="M12 0c.9 7.2 4.4 10.9 12 12-7.6 1.1-11.1 4.8-12 12-.9-7.2-4.4-10.9-12-12 7.6-1.1 11.1-4.8 12-12Z" />
    </svg>
  );
}

/** Soft, out-of-focus leaves for the corners of the room (as in the reference photograph). */
function Foliage({ className }: { className: string }) {
  const leaves = [
    { a: -62, l: 150, w: 34 },
    { a: -40, l: 185, w: 40 },
    { a: -18, l: 210, w: 42 },
    { a: 4, l: 196, w: 40 },
    { a: 24, l: 170, w: 36 },
    { a: -50, l: 120, w: 30 },
    { a: 12, l: 140, w: 32 },
    { a: -30, l: 235, w: 38 },
  ];
  return (
    <svg aria-hidden="true" viewBox="-120 -260 260 280" className={className}>
      <defs>
        <linearGradient id="oravie-leaf" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#123d2a" />
          <stop offset="0.55" stopColor="#2f7a45" />
          <stop offset="1" stopColor="#6db35f" />
        </linearGradient>
      </defs>
      {leaves.map((f, i) => (
        <g key={i} transform={`rotate(${f.a})`}>
          <path
            d={`M0 0C${f.w} ${-f.l * 0.3} ${f.w * 0.8} ${-f.l * 0.78} 0 ${-f.l}C${-f.w * 0.8} ${-f.l * 0.78} ${-f.w} ${-f.l * 0.3} 0 0Z`}
            fill="url(#oravie-leaf)"
            opacity={0.75 + (i % 3) * 0.08}
          />
          <path d={`M0 0L0 ${-f.l * 0.96}`} stroke="#a6dc8c" strokeOpacity=".35" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ parts */

function Navigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="ov-nav" data-o-nav data-o-fade>
      <div className="ov-brand-row">
        <TransitionLink href="/" className="ov-brand">
          <ToothMark className="ov-brand-mark" />
          <span className="ov-brand-text">
            <span className="ov-brand-name">{BRAND.name}</span>{" "}
            <span className="ov-brand-sub">{BRAND.sub}</span>
          </span>
        </TransitionLink>
        <span aria-hidden="true" className="ov-brand-rule" />
      </div>

      <nav aria-label="Main" className="ov-nav-links">
        <ul className="ov-links">
          {NAV.map((item) => (
            <li key={item.label}>
              <TransitionLink href={item.href} className={`ov-link ${item.active ? "ov-link-active" : ""}`} aria-current={item.active ? "page" : undefined}>
                {item.label}
              </TransitionLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="ov-nav-right">
        <TransitionLink href="/appointment" className="ov-nav-cta">
          <CalendarIcon />
          <span>
            Book<span className="ov-nav-cta-long"> Appointment</span>
          </span>
        </TransitionLink>
        <button type="button" className="ov-menu-btn" aria-expanded={open} aria-controls="oravie-menu" onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="oravie-menu" aria-label="Mobile" className="ov-mobile-menu">
          <ul>
            {NAV.map((item) => (
              <li key={item.label}>
                <TransitionLink href={item.href} onClick={() => setOpen(false)} aria-current={item.active ? "page" : undefined}>
                  {item.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const style = {
    "--fd": `${3.2 + (index % 3) * 0.55}s`,
    "--fdl": `${-index * 0.9}s`,
    "--x": service.x,
    "--y": service.y,
    "--ry": service.ry,
    "--rz": service.rz,
    "--mx": service.mx,
    "--my": service.my,
    "--mry": service.ry.startsWith("-") ? "-16deg" : "16deg",
  } as CSSProperties;
  return (
    <div className="ov-slot" style={style} data-o-slot>
      <div className="ov-float" data-o-float data-alt={index % 2 ? "" : undefined}>
        <TransitionLink href="/treatments" className="ov-card" data-o-card data-o-fade>
          <span className="ov-face">
            <span className={`ov-card-icon ${service.wide ? "ov-card-icon-wide" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-rendered icon */}
              <img src={icon(service.icon)} alt="" draggable={false} />
              {service.sparkles ? <Sparkle style={{ width: "34%", right: "-18%", top: "-8%" }} /> : null}
              {service.sparkles === 2 ? <Sparkle style={{ width: "22%", left: "-14%", top: "18%" }} /> : null}
            </span>
            <span className="ov-card-label">
              {service.label[0]}{" "}
              <br />
              {service.label[1]}
            </span>
          </span>
        </TransitionLink>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export function OraviePage({ fontClass = "" }: { fontClass?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const journeyTrigger = useRef<ScrollTrigger | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const onSceneReady = useCallback(() => setSceneReady(true), []);

  // The tooth descends onto the pedestal once its first frame has been drawn.
  useEffect(() => {
    if (!sceneReady) return;
    if (window.matchMedia(MQ.reduce).matches) {
      oravieState.intro = 1;
      return;
    }
    const tween = gsap.to(oravieState, { intro: 1, duration: 2.6, ease: "power3.out", delay: 0.1 });
    return () => {
      tween.kill();
    };
  }, [sceneReady]);

  /** "Watch Video": plays the care journey by gliding through the pinned scroll scene. */
  const playJourney = useCallback(() => {
    const st = journeyTrigger.current;
    if (!st) {
      document.getElementById("oravie-journey")?.scrollIntoView({ behavior: "smooth", block: "end" });
      return;
    }
    const lenis = getLenis();
    const target = st.end - 1;
    if (lenis) lenis.scrollTo(target, { duration: 8, easing: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) });
    else window.scrollTo({ top: target, behavior: "smooth" });
  }, []);

  useGSAP(
    () => {
      resetOravieState();
      const q = gsap.utils.selector(root);
      const [hero] = q("[data-o-hero]") as HTMLElement[];
      const [scene] = q("[data-o-scene]") as HTMLElement[];
      const [stage] = q("[data-o-stage]") as HTMLElement[];
      const [title] = q("[data-o-title]") as HTMLElement[];
      const [lede] = q("[data-o-lede]") as HTMLElement[];
      const steps = q("[data-o-step]") as HTMLElement[];
      const chevrons = q("[data-o-chevron]") as unknown as SVGElement[];

      // Journey markers stay as in the reference until the journey starts playing.
      let shown = -2;
      const showStage = (p: number) => {
        const idx = p < 0.015 ? -1 : journeyStage(p);
        if (idx === shown) return;
        shown = idx;
        steps.forEach((el, i) => {
          if (idx < 0) delete el.dataset.state;
          else el.dataset.state = i < idx ? "done" : i === idx ? "active" : "next";
        });
        chevrons.forEach((el, i) => {
          if (idx < 0) el.removeAttribute("data-lit");
          else el.setAttribute("data-lit", String(i < idx));
        });
      };

      const mm = gsap.matchMedia();
      mm.add({ desktop: MQ.desktop, tall: MQ.phonePin, short: MQ.phoneShort }, (ctx) => {
        const { desktop, short } = ctx.conditions as { desktop: boolean; tall: boolean; short: boolean };
        const d = enterDelay(0.1);

        // ------------------------------------------------------------ intro
        SplitText.create(title, {
          type: "lines",
          aria: "none",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 115, duration: 1.4, ease: "reveal", stagger: 0.13, delay: d + 0.3 }),
        });
        SplitText.create(lede, {
          type: "lines",
          aria: "none",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: "reveal", stagger: 0.08, delay: d + 0.65 }),
        });
        gsap.set([title, lede], { visibility: "visible" });

        // Cards burst out of the tooth: each starts most of the way towards the stage centre.
        const sr = stage.getBoundingClientRect();
        const toCentre = (axis: "x" | "y") => (_: number, el: HTMLElement) => {
          const r = el.getBoundingClientRect();
          return axis === "x" ? (sr.left + sr.width / 2 - (r.left + r.width / 2)) * 0.72 : (sr.top + sr.height * 0.4 - (r.top + r.height / 2)) * 0.72;
        };

        const intro = gsap.timeline({ delay: d, defaults: { ease: "reveal" } });
        intro
          .fromTo(q("[data-o-photo]"), { scale: 1.14, opacity: 0 }, { scale: 1, opacity: 1, duration: 3, ease: "power2.out" }, 0)
          .fromTo(q("[data-o-nav]"), { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 1.1 }, 0.1)
          .fromTo(q("[data-o-eyebrow]"), { autoAlpha: 0, letterSpacing: "0.9em" }, { autoAlpha: 1, letterSpacing: desktop ? "0.42em" : "0.36em", duration: 1.6 }, 0.15)
          .fromTo(q("[data-o-action]"), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.95)
          .fromTo(q("[data-o-panel]"), { opacity: 0, yPercent: 40 }, { opacity: 1, yPercent: 0, duration: 1.5 }, 0.55)
          .fromTo(q("[data-o-panel-head]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 1.0)
          .fromTo(steps, { autoAlpha: 0, y: 28, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, stagger: 0.12 }, 1.15)
          .fromTo(chevrons, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.8, stagger: 0.12 }, 1.45)
          .fromTo(
            q("[data-o-card]"),
            { opacity: 0, scale: 0.35, x: toCentre("x"), y: toCentre("y"), filter: "blur(8px)" },
            // filter is cleared afterwards: a leftover filter would switch off the cards' glass blur
            { opacity: 1, scale: 1, x: 0, y: 0, filter: "blur(0px)", duration: 1.4, ease: "expo.out", stagger: 0.08, clearProps: "filter" },
            1.45
          )
          .fromTo(q("[data-o-wire]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, stagger: 0.07, ease: "power2.inOut" }, 2.05)
          .fromTo(q("[data-o-wire-dot]"), { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, stagger: 0.05, ease: "back.out(3)" }, 2.5)
          .fromTo(q("[data-o-cue]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1 }, 2.3);

        // Ambient life (card float, wire pulses, sparkles) is CSS — it runs on the compositor.

        // ------------------------------------------------------------ the care journey (scroll)
        if (!short) {
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: desktop ? hero : scene,
              start: desktop ? "top top" : "bottom bottom",
              end: desktop ? "+=240%" : "+=200%",
              pin: true,
              scrub: 0.7,
              anticipatePin: 1,
              refreshPriority: 1, // measured before the sections below it (see the sort at the end)
              snap: { snapTo: [0, 0.33, 0.61, 1], duration: { min: 0.25, max: 0.8 }, delay: 0.1, ease: "power2.inOut", inertia: false },
              onUpdate: (self) => {
                oravieState.journey = self.progress;
                showStage(self.progress);
              },
            },
          });
          tl.to(q("[data-o-cue]"), { autoAlpha: 0, y: 12, duration: 0.04 }, 0.005)
            .to(q("[data-o-slot]"), { opacity: 0.4, duration: 0.08 }, 0.1)
            .to(q("[data-o-wires]"), { opacity: 0.25, duration: 0.08 }, 0.1)
            .to(q("[data-o-slot]"), { opacity: 1, duration: 0.08 }, 0.88)
            .to(q("[data-o-wires]"), { opacity: 1, duration: 0.08 }, 0.88)
            .set({}, {}, 1);
          journeyTrigger.current = tl.scrollTrigger ?? null;
        } else {
          // Short / landscape phones: no pin — the journey plays as the stage scrolls past.
          ScrollTrigger.create({
            trigger: scene,
            start: "top 75%",
            end: "bottom 25%",
            scrub: 0.6,
            onUpdate: (self) => {
              oravieState.journey = self.progress;
              showStage(self.progress);
            },
          });
        }

        // The sections further down (treatments, technology) are child components, so React set up
        // their ScrollTriggers before this one. Put every trigger back in page order and re-measure,
        // so their start points include the hero's pinned scroll distance.
        ScrollTrigger.sort();
        ScrollTrigger.refresh();

        return () => {
          journeyTrigger.current = null;
          oravieState.journey = 0;
          showStage(0);
        };
      });

      return () => resetOravieState();
    },
    { scope: root }
  );

  return (
    <div ref={root} id="oravie-page" className={`ov-root ${fontClass}`}>
      {/* The room: the clinic photograph, tinted to the night-blue palette, with leaves in the corners. */}
      <div aria-hidden="true" className="ov-backdrop">
        {/* backdrop.webp is the clinic photo with its blur and blue grade baked in (no live filters). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative backdrop on a static export */}
        <img data-o-photo className="ov-photo" src={asset("/images/oravie/backdrop.webp")} alt="" />
        <div className="ov-tint" />
        <Foliage className="ov-foliage ov-foliage-left" />
        <Foliage className="ov-foliage ov-foliage-right" />
      </div>

      {/* Outer div: the hero is pinned (wrapped in a pin-spacer) on desktop. */}
      <div className="ov-hero-wrap">
        <section data-o-hero className="ov-hero" aria-labelledby="oravie-title">
          {/* The menu bar spans the full screen width (the frame below is the scaled reference grid). */}
          <Navigation />
          <div className="ov-frame">

            <div className="ov-copy">
              <p data-o-eyebrow data-animate className="ov-eyebrow">
                Advanced Dental Care
              </p>
              <h1 id="oravie-title" data-o-title data-animate className="ov-title">
                <span>
                  Your <span className="ov-accent">Smile.</span>
                </span>
                <span>
                  Our Innovation<span className="ov-accent">.</span>
                </span>
              </h1>
              <p data-o-lede data-animate className="ov-lede">
                Experience modern dentistry with precision, innovation and personalized care.
              </p>
              <div className="ov-actions">
                <div data-o-action data-o-fade>
                  <Magnetic strength={0.2}>
                    <TransitionLink href="/appointment" className="ov-btn-primary">
                      Book Appointment <ArrowIcon />
                    </TransitionLink>
                  </Magnetic>
                </div>
                <div data-o-action data-o-fade>
                  <button type="button" className="ov-btn-ghost" onClick={playJourney} aria-label="Watch Video: play the dental care journey">
                    <PlayIcon /> Watch Video
                  </button>
                </div>
              </div>
            </div>

            {/* Outer div: on phones the scene itself is pinned. */}
            <div className="ov-scene-wrap">
              <div data-o-scene className="ov-scene">
                <div data-o-stage className="ov-stage">
                  {/* The canvas only covers the stage (not the whole screen): far fewer pixels to draw each frame. */}
                  <div
                    className="ov-canvas"
                    data-ready={sceneReady || undefined}
                    role="img"
                    aria-label="3D tooth on a glowing pedestal. As you scroll it shows decay, a cross-section treatment and the restored tooth."
                  >
                    <ToothScene onReady={onSceneReady} anchor={anchor} />
                  </div>
                  <div ref={anchor} aria-hidden="true" className="ov-anchor" />
                  <svg aria-hidden="true" data-o-wires className="ov-wires" viewBox="0 0 860 560" preserveAspectRatio="none">
                    {SERVICES.map(({ wire: [a, c, b], icon: key }) => {
                      const d = `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
                      return (
                        <g key={key}>
                          <path data-o-wire className="ov-wire-glow" d={d} pathLength={1} strokeDasharray="1" />
                          <path data-o-wire className="ov-wire" d={d} pathLength={1} strokeDasharray="1" />
                          <path className="ov-wire-pulse" d={d} pathLength={1} />
                          <circle data-o-wire-dot className="ov-wire-dot" cx={a[0]} cy={a[1]} r="3" />
                          <circle data-o-wire-dot className="ov-wire-dot" cx={b[0]} cy={b[1]} r="3.4" />
                        </g>
                      );
                    })}
                  </svg>
                  {SERVICES.map((sv, i) => (
                    <ServiceCard key={sv.icon} service={sv} index={i} />
                  ))}
                </div>

                <div aria-hidden="true" data-o-cue className="ov-cue">
                  <span>SCROLL TO EXPLORE</span>
                  <svg viewBox="0 0 26 14" className="ov-cue-chevron" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 2l11 10L24 2" />
                  </svg>
                </div>

                <section id="oravie-journey" data-o-panel className="ov-panel" aria-labelledby="oravie-journey-title">
                  <div data-o-panel-head data-animate className="ov-panel-head">
                    <span aria-hidden="true" className="ov-panel-rule" />
                    <h2 id="oravie-journey-title" className="ov-panel-title">
                      The Dental <span className="ov-accent">Care Journey</span>
                    </h2>
                    <span aria-hidden="true" className="ov-panel-rule" />
                  </div>
                  <ol className="ov-steps">
                    {STEPS.map((step, i) => (
                      <li key={step.label} className="ov-step-item">
                        {i > 0 && <Chevrons />}
                        <div data-o-step data-animate className="ov-step">
                          <div className="ov-step-visual">
                            <span aria-hidden="true" className="ov-pedestal" />
                            <span className="ov-step-icon-box">
                              {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-rendered icon */}
                              <img className="ov-step-icon" src={icon(step.icon)} alt="" draggable={false} />
                              {step.badge === "check" && (
                                <span aria-hidden="true" className="ov-check">
                                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3.5 8.4l3 3 6-6.6" />
                                  </svg>
                                </span>
                              )}
                              {step.badge === "sparkles" && (
                                <>
                                  <Sparkle style={{ width: "30%", left: "-22%", top: "-10%" }} />
                                  <Sparkle style={{ width: "22%", right: "-16%", top: "-16%" }} />
                                  <Sparkle style={{ width: "16%", right: "-26%", top: "30%" }} />
                                </>
                              )}
                            </span>
                          </div>
                          <span className="ov-step-label">{step.label}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="oravie-treatments" className="relative z-10 bg-mist text-navy" aria-labelledby="oravie-treatments-label">
        <div className="shell flex flex-wrap items-end justify-between gap-5 pt-12 sm:pt-16">
          <div>
            <p id="oravie-treatments-label" className="font-ui text-caption tracking-[0.22em] text-navy/70">TREATMENTS</p>
            <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-navy/65">Explore care options from the Oravie experience, with the full treatment guide one click away.</p>
          </div>
          <TransitionLink href="/treatments" className="font-ui link-draw inline-flex items-center gap-2 pb-2 text-sm text-navy">
            View all treatments <span aria-hidden="true">↗</span>
          </TransitionLink>
        </div>
        <TreatmentsSection />
      </section>

      <TechnologySection />

      <HospitalSection />

      <ProcessSection />

      <GalleryPreview />
    </div>
  );
}
