"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { preload } from "react-dom";
import { TransitionLink } from "@/components/animations/transition-link";
import { Magnetic } from "@/components/animations/magnetic";
import { MenuIcon, SiteMenu } from "@/components/navigation/site-menu";
import { journeyStage, oravieState, resetOravieState } from "@/components/oravie/oravie-state";
import { TOOTH_HERO_MODEL_URL } from "@/config/models";
import { asset } from "@/lib/asset";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getLenis, transitionState } from "@/lib/scroll-state";
import { TreatmentsSection } from "@/components/treatments/treatments-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { ProcessSection } from "@/components/sections/process-section";
import { HospitalSection } from "@/components/sections/hospital-section";
import { GalleryPreview } from "@/components/sections/gallery-preview";
import { mainNav } from "@/config/site";

/**
 * three.js needs WebGL 2 — and the hero scene needs a GPU: drawn in software (graphics acceleration off,
 * blocked GPU drivers, machines without a GPU such as PageSpeed Insights' test machines) it runs at a
 * few frames per second and freezes the page while it does. In those cases, and without WebGL 2 at all,
 * the hero shows a still of the scene instead. `failIfMajorPerformanceCaveat` is the browser's own
 * "this would be software rendering" signal. Checked once, in the browser only.
 */
let webgl2: boolean | undefined;
function supportsWebGL2() {
  if (webgl2 === undefined) {
    try {
      const gl = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      webgl2 = !!gl;
    } catch {
      webgl2 = false;
    }
  }
  return webgl2;
}
const noSubscribe = () => () => {};
/** null while server-rendering / hydrating, then whether the browser has WebGL 2. */
const useWebGL2 = () => useSyncExternalStore(noSubscribe, supportsWebGL2, () => null);

const loadToothScene = () => import("@/components/three/oravie-tooth-scene");
const ToothScene = dynamic(loadToothScene, { ssr: false, loading: () => null });
// Fetch the 3D code (~270 KB) as soon as this module runs — while the page is still hydrating —
// instead of when the scene first renders afterwards.
if (typeof window !== "undefined" && supportsWebGL2()) loadToothScene().catch(() => undefined);

/** Keeps a 3D failure (lost GPU, model download error) inside the hero instead of taking the page down. */
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

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

const Chevrons = ({ index }: { index: number }) => (
  <svg aria-hidden="true" viewBox="0 0 36 30" className="ov-chevrons" data-o-chevron style={{ "--i": index } as CSSProperties} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
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

/** The page behind the open menu (made inert): everything on the page but the bar itself. */
const menuBackground = () => {
  const page = document.getElementById("oravie-page");
  const rest = Array.from(page?.children ?? []).filter((el) => !el.classList.contains("ov-hero-wrap"));
  return [page?.querySelector(".ov-frame"), ...rest, document.querySelector("footer")];
};

const MENU_LINKS = NAV.map(({ label, href, active }) => ({ label, href, current: active }));

function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggle.current?.focus();
  }, []);

  return (
    <>
      {/* While the menu is open the bar is fixed above it (data-menu-open), so ✕ stays in reach. */}
      <header className="ov-nav" data-o-nav data-o-fade data-menu-open={open || undefined}>
        <div className="ov-brand-row">
          <TransitionLink href="/" className="ov-brand" onClick={() => setOpen(false)}>
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
          <TransitionLink href="/appointment" className="ov-nav-cta" onClick={() => setOpen(false)}>
            <CalendarIcon />
            <span>
              Book<span className="ov-nav-cta-long"> Appointment</span>
            </span>
          </TransitionLink>
          <button
            ref={toggle}
            type="button"
            className="ov-menu-btn menu-toggle"
            aria-expanded={open}
            aria-controls="oravie-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </header>
      {/* A sibling of the bar, not inside it: the bar's intro animation would otherwise trap the fixed menu. */}
      <SiteMenu id="oravie-menu" open={open} onClose={close} toggle={toggle} links={MENU_LINKS} closeFrom={1024} background={menuBackground} />
    </>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  // The intro bursts each card out of the tooth: it starts 72% of the way to the stage centre (50%, 40%).
  const burst = (from: string, centre: number) => ((centre - parseFloat(from)) * 0.72).toFixed(2);
  const style = {
    "--i": index,
    "--ox": burst(service.x, 50),
    "--oy": burst(service.y, 40),
    "--mox": burst(service.mx, 50),
    "--moy": burst(service.my, 40),
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
  // "live": the WebGL scene; "still": a picture of it (no WebGL 2, or the scene failed to load).
  const webgl = useWebGL2();
  const [sceneFailed, setSceneFailed] = useState(false);
  const onSceneError = useCallback(() => setSceneFailed(true), []);
  const scene3d = webgl === null ? "pending" : webgl && !sceneFailed ? "live" : "still";
  // Arriving through a page transition, the intro waits for the curtain to lift.
  const [enterDelay] = useState(() => (transitionState.active ? 0.65 : 0.1));

  // The tooth model downloads alongside the page's scripts rather than after them (low priority, so
  // it never holds up the styles, fonts, scripts or the backdrop photo).
  preload(TOOTH_HERO_MODEL_URL, { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });

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
      // The pinned element's existing wrapper serves as its pin-spacer: the element is never moved in
      // the DOM, which would restart the CSS intro running inside it.
      const [heroWrap] = q(".ov-hero-wrap") as HTMLElement[];
      const [sceneWrap] = q(".ov-scene-wrap") as HTMLElement[];
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

        // The intro (photo, menu, copy, cards, wires, journey panel) is CSS — see "intro" in oravie.css —
        // so it starts with the first paint instead of waiting for this script to download and run.
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
              pinSpacer: desktop ? heroWrap : sceneWrap,
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
    <div ref={root} id="oravie-page" className={`ov-root ${fontClass}`} style={{ "--ov-d": `${enterDelay}s` } as CSSProperties}>
      {/* The room: the clinic photograph, tinted to the night-blue palette, with leaves in the corners. */}
      <div aria-hidden="true" className="ov-backdrop">
        {/* backdrop.webp is the clinic photo with its blur and blue grade baked in (no live filters). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative backdrop on a static export */}
        <img data-o-photo className="ov-photo" src={asset("/images/oravie/backdrop.webp")} alt="" />
        {/* The photo's fade-in is this night-blue veil lifting off it (the same look as fading the
            photo itself), so the photo counts as painted at once: Chrome times the largest paint (LCP)
            of an image that fades in from transparent only once the fade has finished. */}
        <div className="ov-photo-veil" />
        <div className="ov-tint" />
        <Foliage className="ov-foliage ov-foliage-left" />
        <Foliage className="ov-foliage ov-foliage-right" />
      </div>

      {/* Outer div: the pin-spacer while the hero is pinned (desktop). */}
      <div className="ov-hero-wrap">
        <section data-o-hero className="ov-hero" aria-labelledby="oravie-title">
          {/* The menu bar spans the full screen width (the frame below is the scaled reference grid). */}
          <Navigation />
          <div className="ov-frame">

            <div className="ov-copy">
              <p data-o-eyebrow className="ov-eyebrow">
                Advanced Dental Care
              </p>
              {/* Each line rises out of its own mask (.ov-line) in the CSS intro. */}
              <h1 id="oravie-title" data-o-title className="ov-title">
                <span className="ov-line" style={{ "--i": 0 } as CSSProperties}>
                  <span>
                    Your <span className="ov-accent">Smile.</span>
                  </span>
                </span>
                <span className="ov-line" style={{ "--i": 1 } as CSSProperties}>
                  <span>
                    Our Innovation<span className="ov-accent">.</span>
                  </span>
                </span>
              </h1>
              <p data-o-lede className="ov-lede">
                <span>Experience modern dentistry with precision, innovation and personalized care.</span>
              </p>
              <div className="ov-actions">
                <div data-o-action data-o-fade style={{ "--i": 0 } as CSSProperties}>
                  <Magnetic strength={0.2}>
                    <TransitionLink href="/appointment" className="ov-btn-primary">
                      Book Appointment <ArrowIcon />
                    </TransitionLink>
                  </Magnetic>
                </div>
                <div data-o-action data-o-fade style={{ "--i": 1 } as CSSProperties}>
                  <button type="button" className="ov-btn-ghost" onClick={playJourney} aria-label="Watch Video: play the dental care journey">
                    <PlayIcon /> Watch Video
                  </button>
                </div>
              </div>
            </div>

            {/* Outer div: the pin-spacer while the scene is pinned (phones). */}
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
                    {scene3d === "live" && (
                      <SceneBoundary onError={onSceneError}>
                        <ToothScene onReady={onSceneReady} anchor={anchor} />
                      </SceneBoundary>
                    )}
                  </div>
                  <div ref={anchor} aria-hidden="true" className="ov-anchor">
                    {scene3d === "still" && (
                      // eslint-disable-next-line @next/next/no-img-element -- static export; fallback still of the 3D scene
                      <img className="ov-still" src={asset("/images/oravie/tooth-scene.webp")} alt="" draggable={false} />
                    )}
                  </div>
                  <svg aria-hidden="true" data-o-wires className="ov-wires" viewBox="0 0 860 560" preserveAspectRatio="none">
                    {SERVICES.map(({ wire: [a, c, b], icon: key }, k) => {
                      const d = `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
                      const i = (n: number) => ({ "--i": 2 * k + n }) as CSSProperties;
                      return (
                        <g key={key}>
                          <path data-o-wire className="ov-wire-glow" d={d} pathLength={1} strokeDasharray="1" style={i(0)} />
                          <path data-o-wire className="ov-wire" d={d} pathLength={1} strokeDasharray="1" style={i(1)} />
                          <path className="ov-wire-pulse" d={d} pathLength={1} />
                          <circle data-o-wire-dot className="ov-wire-dot" cx={a[0]} cy={a[1]} r="3" style={i(0)} />
                          <circle data-o-wire-dot className="ov-wire-dot" cx={b[0]} cy={b[1]} r="3.4" style={i(1)} />
                        </g>
                      );
                    })}
                  </svg>
                  {SERVICES.map((sv, i) => (
                    <ServiceCard key={sv.icon} service={sv} index={i} />
                  ))}
                </div>

                <div aria-hidden="true" data-o-cue className="ov-cue">
                  {/* The CSS intro moves this inner box; the scroll timeline moves the outer one. */}
                  <div className="ov-cue-in">
                    <span>SCROLL TO EXPLORE</span>
                    <svg viewBox="0 0 26 14" className="ov-cue-chevron" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 2l11 10L24 2" />
                    </svg>
                  </div>
                </div>

                <section id="oravie-journey" data-o-panel className="ov-panel" aria-labelledby="oravie-journey-title">
                  <div data-o-panel-head className="ov-panel-head">
                    <span aria-hidden="true" className="ov-panel-rule" />
                    <h2 id="oravie-journey-title" className="ov-panel-title">
                      The Dental <span className="ov-accent">Care Journey</span>
                    </h2>
                    <span aria-hidden="true" className="ov-panel-rule" />
                  </div>
                  <ol className="ov-steps">
                    {STEPS.map((step, i) => (
                      <li key={step.label} className="ov-step-item">
                        {i > 0 && <Chevrons index={i - 1} />}
                        <div data-o-step className="ov-step" style={{ "--i": i } as CSSProperties}>
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
