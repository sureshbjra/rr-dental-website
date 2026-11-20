"use client";

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { getLenis, transitionState } from "@/lib/scroll-state";
import { Logo } from "@/components/ui/logo";

type TransitionApi = { navigate: (href: string) => void };
const TransitionContext = createContext<TransitionApi>({ navigate: () => {} });
export const usePageTransition = () => useContext(TransitionContext);

/**
 * Route transitions as a scan: a navy panel sweeps up over the page with the glowing scan line on its
 * leading edge, the route changes underneath, then the panel lifts away trailing the line while the
 * new page's entrance plays. Browser back/forward and reduced-motion users get instant navigation.
 */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lift = useCallback(() => {
    const el = overlay.current;
    if (!el) return;
    const panel = el.querySelector("[data-panel]");
    const mark = el.querySelector("[data-mark]");
    gsap
      .timeline({
        onComplete: () => {
          gsap.set(el, { visibility: "hidden" });
          transitionState.active = false;
          // Move focus to the new page so keyboard and screen-reader users start at its content.
          document.getElementById("main")?.focus({ preventScroll: true });
        },
      })
      .to(mark, { autoAlpha: 0, y: -12, duration: 0.3, ease: "power2.in" })
      .set(el.querySelector("[data-edge-top]"), { autoAlpha: 0 })
      .set(el.querySelector("[data-edge-bottom]"), { autoAlpha: 1 })
      .to(panel, { yPercent: -100, duration: 0.95, ease: "cinematic" }, "<0.05");
  }, []);

  const navigate = useCallback(
    (href: string) => {
      const target = href.split("#")[0] || "/";
      if (target === pathname) {
        getLenis()?.scrollTo(0, { duration: 1 });
        return;
      }
      if (prefersReducedMotion() || pending.current) {
        router.push(href);
        return;
      }
      const el = overlay.current;
      if (!el) return router.push(href);
      pending.current = true;
      transitionState.active = true;
      getLenis()?.stop();
      router.prefetch(href);

      const panel = el.querySelector("[data-panel]");
      const mark = el.querySelector("[data-mark]");
      gsap
        .timeline()
        .set(el, { visibility: "visible" })
        .set(el.querySelector("[data-edge-top]"), { autoAlpha: 1 })
        .set(el.querySelector("[data-edge-bottom]"), { autoAlpha: 0 })
        .fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: "cinematic" })
        .fromTo(mark, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35 }, "-=0.3")
        .add(() => router.push(href));

      // Never leave the curtain down if navigation stalls.
      safety.current = setTimeout(() => {
        if (!pending.current) return;
        pending.current = false;
        getLenis()?.start();
        lift();
      }, 6000);
    },
    [pathname, router, lift]
  );

  // New route committed → reset scroll, rebuild triggers, lift the curtain.
  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    if (safety.current) clearTimeout(safety.current);
    window.scrollTo(0, 0);
    const lenis = getLenis();
    lenis?.scrollTo(0, { immediate: true, force: true });
    lenis?.start();
    requestAnimationFrame(() => {
      // Persistent triggers (footer, nav) were created before this page's pins — order by position first.
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      lift();
    });
  }, [pathname, lift]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div ref={overlay} aria-hidden className="pointer-events-none invisible fixed inset-0 z-[100] overflow-hidden">
        {/* No inline transform here: GSAP owns it (an inline translateY would be parsed as px and stacked). */}
        <div data-panel className="absolute inset-0 bg-navy">
          <div data-edge-top className="absolute inset-x-0 top-0 h-px bg-cyan shadow-[0_0_28px_6px_rgb(56_189_248/0.55)]" />
          <div data-edge-bottom className="absolute inset-x-0 bottom-0 h-px bg-cyan opacity-0 shadow-[0_0_28px_6px_rgb(56_189_248/0.55)]" />
          <div data-mark className="absolute inset-0 grid place-items-center text-mist opacity-0">
            <Logo />
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
