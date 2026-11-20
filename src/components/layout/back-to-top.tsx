"use client";

import { getLenis } from "@/lib/scroll-state";

export function BackToTop() {
  return (
    <button
      type="button"
      className="font-ui link-draw inline-block py-2 text-mist/60 transition-colors hover:text-mist"
      onClick={() => {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { duration: 1.6 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      Back to top
    </button>
  );
}
