import { gsap } from "@/lib/gsap";

/**
 * Keyboard safety net for entrance animations: when focus lands inside something that is still
 * mid-reveal (opacity < 1), finish its entrance immediately so the focus ring is never on an
 * invisible element. Scroll-scrubbed animations are left alone — they follow the scroll position,
 * which the browser updates as it brings the focused element into view.
 */
export function installRevealOnFocus() {
  const onFocusIn = (e: FocusEvent) => {
    let node = e.target instanceof Element ? e.target : null;
    while (node && node !== document.body) {
      if (parseFloat(getComputedStyle(node).opacity) < 0.99) {
        const tweens = gsap.getTweensOf(node);
        const scrubbed = tweens.some((t) => t.scrollTrigger?.vars.scrub);
        if (!scrubbed) {
          tweens.forEach((t) => t.progress(1));
          if (parseFloat(getComputedStyle(node).opacity) < 0.99) {
            gsap.set(node, { opacity: 1, x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0 });
          }
        }
      }
      node = node.parentElement;
    }
  };
  document.addEventListener("focusin", onFocusIn);
  return () => document.removeEventListener("focusin", onFocusIn);
}
