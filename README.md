# RR Dental — Futuristic 3D Dental Hospital Website

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Three.js / React Three Fiber / Drei · GSAP + ScrollTrigger · Lenis
(Motion is installed but not imported — nothing of it ships to the browser.)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npm run model:tooth` | Regenerate `public/models/tooth.glb` (and the home hero's slim copy, `tooth-hero.glb`) |
| `npm run model:tooth-hero` | Regenerate only `public/models/tooth-hero.glb` from `tooth.glb` |

## Publishing (GitHub Pages)

Every push to `main` builds the site and publishes it to **https://sureshbjra.github.io/rr-dental-website/**
(`.github/workflows/deploy-pages.yml`; progress under the repo's **Actions** tab).

- The Pages build is a static export (`STATIC_EXPORT=true`) served from a sub-path
  (`NEXT_PUBLIC_BASE_PATH=/rr-dental-website`). Locally neither is set, so `npm run dev` / `build` /
  `start` behave as before. Static exports can't use Cache Components, so it is turned off for that
  build only (every page is static anyway).
- Next adds the base path to routes, scripts and fonts, but not to plain string URLs: wrap paths to files
  in `public/` with `asset()` from `src/lib/asset.ts` (the 3D model, poster, gallery photos and icons do).
- Try the Pages build locally:
  `STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/rr-dental-website npx next build` → `out/`.
- Own domain (e.g. rrdentalhospital.com): add it in the repo's **Settings → Pages → Custom domain** and
  create the DNS records GitHub shows. The workflow then builds without the sub-path automatically.

## Key files

- `src/app/globals.css` — brand tokens, shadcn theme, `glass` / `text-holo` / `glow-cyan` utilities
- `src/config/theme.ts`, `src/config/site.ts` — brand colours, nav, contact details
- `src/config/models.ts` — 3D asset URLs (three.js-free, safe to import anywhere)
- `src/lib/gsap.ts` — GSAP + ScrollTrigger + useGSAP registration (client only)
- `src/lib/three.ts` — canvas defaults, tone mapping, quality tiers
- `src/hooks/use-lenis.ts` — Lenis driven by the GSAP ticker
- `src/components/providers.tsx` — smooth scroll, page transitions, font-load refresh, reveal-on-focus
- `src/lib/reveal-on-focus.ts` — keyboard safety net: focusing something still hidden by an entrance animation finishes it
- `src/components/three/scene-loader.tsx` — poster image (LCP) → idle-loaded 3D scene; WebGL check + error boundary
- `src/app/not-found.tsx` — styled 404
- `src/components/three/three-d-scene.tsx` — hero canvas
- `src/components/three/tooth/` — tooth model, studio lighting, motion rig, holographic base

## 3D tooth model

The hero molar is generated from code. `scripts/tooth/sdf.mjs` sculpts a mandibular first molar as a
signed distance field (5 cusps, fissures, cervical constriction, two curved roots — all blends C2-smooth so
glossy reflections stay clean), and `scripts/tooth/build-tooth.mjs` turns it into an optimised GLB:

```bash
npm run model:tooth   # → public/models/tooth.glb (~41k triangles, ~300 KB, meshopt-compressed)
```

- Surface nets mesh → normal-aware, regularised simplification (meshoptimizer) → quantised +
  `EXT_meshopt_compression` (the decoder ships with drei — no Draco / CDN fetch).
- Analytic SDF normals (12-bit), baked ambient occlusion and enamel → cementum colour in vertex colours.
- PBR material in the GLB: clearcoat, IOR 1.62 (enamel), and a small zone map driving roughness /
  clearcoat (glossy crown, satin cervical enamel, matte root).
- Tunables: `TOOTH_CELL` (grid mm, default 0.085), `TOOTH_RATIO` (triangle ratio, default 0.16).

Scene: procedural Lightformer studio baked once into the environment map (no HDR download), neutral tone
mapping, cinematic blue rim lights, soft contact shadows, holographic base, constant-speed spin with damped
cursor parallax.

Performance: quality tiers (`src/lib/three.ts`; phones / weak GPUs get lower DPR, a smaller environment map
and a one-shot shadow), adaptive DPR via `PerformanceMonitor`, DPR never above the screen's own, rendering
paused when the canvas is off-screen, on-demand rendering with `prefers-reduced-motion`, GLB preloaded from
the HTML head, and three.js kept out of the initial JS bundle.

Loading: the hero first paints `public/images/tooth-poster-{800,1600}.webp` (a render of the live scene,
served with `fetchpriority=high`; it is the LCP element). The 3D chunk loads when the browser is idle and
cross-fades in once its first frame is drawn. Without WebGL, or if the scene throws, the poster simply
stays — the page never breaks. Re-render the poster if the model, lighting or camera change.
WebGL support is probed once per session; the renderer and its context are reused when you come back
to the home page (Next keeps the route mounted while hidden, with rendering stopped).

## Design system — "the scan room"

The site borrows the language of dental scanning. One signature moment, the hero scan, sets a motif
(a glowing scan line / ring) that recurs only where it means something: the page transition, the
scroll progress line, the treatment rows' hover rule and the closing call-to-action.

- **Colour** (brief): Abyss `#071B35` dark chapters · Deep `#0B3159` panels · Signal `#38BDF8` scan,
  focus and the primary action only · Ice `#A7DDFF` secondary text and diagrams · Mist `#EFF8FF` the
  light chapter and primary text on dark.
- **Type**: one family, Archivo Variable, driven by its width axis — `font-display` (125% expanded,
  light) for headings, 100% for reading, `font-ui` (112%) for buttons and links. Fluid scale in
  `globals.css` (`text-display-xl / -l / -s / -m`, `text-lead`, `text-body`, `text-caption`).
  The desktop hero uses `text-display-hero`, which also shrinks with the screen's height: the tooth is
  sized by height, so on 4:3 / 5:4 screens a width-only size would run the headline into it.
- **Layout**: `shell` (max 96rem, fluid gutter) and `section-y` (fluid section rhythm); left-aligned on a
  12-column grid with supporting text in offset columns.
- **Surfaces**: `glass` only for the nav and the scan readout; `panel` for instrument panels.
- **Buttons**: one cyan primary per view, label roll on hover (`<Roll>`), quiet text links with drawn
  underlines (`link-draw`). No arrows, no eyebrow labels, numbering only where content is a sequence.

Page structure: scan room (pinned hero scan) → clinic (Mist sheet: approach + treatments index) →
lab (pinned technology rail with line diagrams) → journey (stacking steps) → close (CTA) → footer.

### The hero scan

`npm run model:tooth` also generates a pulp chamber and canals (`Pulp` node in the GLB). In the scene a
world-space clip plane, tipped towards the camera, cuts the tooth: below it the solid tooth with a flat
cross-section and the glowing pulp; above it the same vertices as a scanned point cloud. `ScanRing`
moves the ring and planes; the hero's ScrollTrigger drives `scrollState.hero.scan` (desktop pins for
the pass; phones run it in place) and updates the glass readout with the section depth in mm.

## Animation system (GSAP)

Everything is built on `gsap.matchMedia()` (`MQ` in `src/lib/gsap.ts`): desktop, mobile and
reduced-motion each get their own variant, and everything is cleaned up automatically on route change.

| Component (`src/components/animations/`) | Effect |
| --- | --- |
| `TextReveal` | SplitText line / word / char reveals out of masks (re-splits on resize & font load) |
| `ScrollHighlight` | Words light up as you scroll (scrubbed; colours configurable) |
| `StaggerReveal` | Staggered entrances for `[data-stagger]` children (rise / flip / fade) |
| `Magnetic` | Magnetic buttons (mouse / trackpad only) |
| `ScrollProgress` | Reading-progress line |
| `PageTransitionProvider` + `TransitionLink` | Scan-wipe route transitions (use `TransitionLink`, not `next/link`) |

Mobile: the same pinned scenes run on phones and tablets with at least 700 px of height (`MQ.mobileTall`
in `lib/gsap.ts`, the `tall:` CSS variant in `globals.css`): the hero fits one screen and holds for the
scan pass, the technology rail slides sideways and settles on the nearest panel when you stop, and the
closing window pins as it opens. Shorter or landscape phones (`MQ.mobileShort`) get in-place versions.
With reduced motion nothing pins and the technology panels wrap into rows. Native touch scrolling
(Lenis `syncTouch` off), `ignoreMobileResize`, `overflow-x: clip` (sticky-safe). No-flash loading: an
inline script marks `<html class="js">` so `[data-animate]` / `[data-stagger]` start hidden only when JS
runs; everything is revealed after 4 s if animations fail to start.

**Accessibility rules for animations** (verified with axe, Lighthouse 100 and keyboard / touch runs):

- SplitText uses `aria: "none"` for lines and words (screen readers get the original text; char splits
  keep `"auto"`). Don't put `aria-label` on a split paragraph.
- Entrance states use `opacity`, never `visibility` / `autoAlpha`, on anything containing links or
  buttons — hidden-by-visibility elements drop out of the Tab order.
- Scroll-highlighted text keeps ≥ 3:1 contrast in its dim state.
- The mobile menu is a modal dialog: focus moves in, Tab is trapped, Escape closes and returns focus,
  the page behind is `inert`. After a route change focus moves to `<main>`; a skip link comes first.

**Pinning in React:** never pin a component's top-level element directly — wrap it in a plain `<div>`
(see `HeroSection`, `CtaSection`). Next 16 keeps the previous page mounted while navigating, and React
must not find a pinned node (moved into GSAP's pin-spacer) where it expects a sibling.

### Smile gallery

Cases live in `src/config/gallery.ts`; photos in `public/images/gallery` as `<name>-<w>.webp` plus a 2× file.
Each before/after pair is cropped to the same size and processed identically (2× Lanczos resize, mild
sharpening): no colour, tone or local retouching, so the comparison stays truthful. On result cases the
"after" photo is uncovered by the cyan scan line (`ScanReveal`); reduced motion shows it straight away.
Only publish photos the patient has agreed to share. Higher-resolution originals from the camera will
look sharper than screenshots.

Homepage copy lives in `src/config/content.ts` — it is placeholder text; confirm treatments and
technology with the clinic.

## Home page loading

- The hero's opening sequence (photo, menu, headline, cards, wires, journey panel) is CSS
  (`oravie.css`, "intro"), so it plays from the first paint instead of waiting for the page's JavaScript.
  GSAP only drives the scroll journey; pinned elements use their existing wrapper as the pin-spacer so
  pinning never moves them (moving an element restarts its CSS animations).
- `tooth-hero.glb` (`scripts/tooth/slim-tooth.mjs`) is `tooth.glb` with only positions, normals and
  indices — the hero paints the tooth with its own shaders — and is preloaded from the HTML at low
  priority, in parallel with the scripts.
- The 3D code is fetched as soon as the page module runs, uses three's own GLTFLoader + meshopt decoder
  and a cube-camera studio environment (drei's `<Environment>` / `useGLTF` pull in HDR, EXR, gain-map
  and Draco loaders), and compiles every shader with `compileAsync` before the first frame, so the
  reveal and the cross-section stage don't stall on shader compilation.
- Without WebGL 2, with software-only WebGL (no GPU / GPU blocked — `failIfMajorPerformanceCaveat`), or
  if the scene fails to load, the hero shows `public/images/oravie/tooth-scene.webp`, a still of the
  scene, instead of crashing the page or rendering at a few frames per second. Note this includes
  headless test browsers (Lighthouse, PageSpeed Insights): they measure the still, not the live scene.

## Notes

- Fonts are self-hosted: Archivo's Latin subset goes through `next/font/local` (preloaded, so headlines
  don't re-wrap after load), with its width axis trimmed to the 100–125 % the site uses
  (`scripts/fonts/instance-archivo.py`, 61 KB instead of 90 KB); other subsets (latin-ext, e.g. ₹) load
  on demand from `@fontsource-variable/archivo`. No build-time Google Fonts fetch.
- Dev only: `window.__rrGsap` (gsap + ScrollTrigger) and `window.__rrGL` (the renderer) for debugging.
- Known console warning: `THREE.Clock … deprecated` comes from inside React Three Fiber 9.x (latest);
  harmless, and it will go away when R3F switches to `THREE.Timer`.
- shadcn is configured in `components.json`; add components with `npx shadcn@latest add <name>`.
- `package.json` overrides `three` so every package (including drei's `stats-gl`) shares one copy.
