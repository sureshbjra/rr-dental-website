"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { usePageTransition } from "@/components/animations/page-transition";

/**
 * Drop-in replacement for next/link that plays the page transition. Modified clicks
 * (new tab, middle click), external links and hash links behave normally.
 */
export function TransitionLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const { navigate } = usePageTransition();
  const url = typeof href === "string" ? href : (href.pathname ?? "/");

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (props.target && props.target !== "_self") return;
    if (/^(https?:|mailto:|tel:|#)/.test(url)) return;
    e.preventDefault();
    navigate(url);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
