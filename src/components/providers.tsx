"use client";

import { useEffect } from "react";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { PageTransitionProvider } from "@/components/animations/page-transition";
import { markAnimationsReady, ScrollTrigger } from "@/lib/gsap";
import { installRevealOnFocus } from "@/lib/reveal-on-focus";

function AnimationLifecycle() {
  useEffect(() => {
    markAnimationsReady();
    // Self-hosted fonts can change text metrics after first layout — re-measure every trigger once.
    document.fonts?.ready.then(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
    return installRevealOnFocus();
  }, []);
  return null;
}

/**
 * App-wide client providers. (Motion is installed but deliberately not loaded here: nothing on the
 * initial route needs it, and GSAP already covers every animation — that keeps ~45 KB gzip off first load.)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <PageTransitionProvider>
        <AnimationLifecycle />
        {children}
      </PageTransitionProvider>
    </SmoothScroll>
  );
}
