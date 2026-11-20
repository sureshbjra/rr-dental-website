"use client";

import "lenis/dist/lenis.css";
import { useLenis } from "@/hooks/use-lenis";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useLenis();
  return <>{children}</>;
}
