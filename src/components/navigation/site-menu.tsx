"use client";

import { useEffect, useRef, type MouseEvent, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/animations/transition-link";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/scroll-state";
import { addressLines, directionsHref, phoneHref, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type MenuLink = { label: string; href: string; current?: boolean };

/** Three lines that fold into a ✕ while the menu is open (styles: `.menu-icon` in globals.css). */
export function MenuIcon({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="menu-icon" data-open={open || undefined}>
      <span />
      <span />
      <span />
    </span>
  );
}

type SiteMenuProps = {
  id: string;
  open: boolean;
  /** Close the menu; `returnFocus` sends keyboard focus back to the toggle (Escape). */
  onClose: (returnFocus: boolean) => void;
  /** The ☰ / ✕ button — part of the menu's focus loop, so it must stay visible above the menu. */
  toggle: RefObject<HTMLButtonElement | null>;
  links: MenuLink[];
  /** Screen width (px) from which the bar shows its links instead: the menu closes itself there. */
  closeFrom: 1024 | 1280;
  /** Everything behind the menu, made inert (unreachable for keyboard and screen readers) while open. */
  background: () => (Element | null | undefined)[];
};

/**
 * The full-screen site menu, shared by the home page's bar and the other pages' bar. A modal dialog:
 * it wipes down over the page, the links rise in one by one, focus moves in, Tab is contained (toggle
 * + menu), Escape closes and returns focus to the toggle, and the page behind is inert and can't scroll.
 * The link size follows the screen height so everything fits; very short screens scroll the menu.
 */
export function SiteMenu({ id, open, onClose, toggle, links, closeFrom, background }: SiteMenuProps) {
  const menu = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const m = menu.current;
      if (!m) return;
      const instant = prefersReducedMotion();
      if (open) {
        gsap.set(m, { display: "flex" });
        gsap
          .timeline()
          .fromTo(m, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: instant ? 0 : 0.7, ease: "cinematic" })
          .fromTo(m.querySelectorAll("[data-menu-item]"), { yPercent: 110 }, { yPercent: 0, duration: instant ? 0 : 0.8, ease: "reveal", stagger: 0.05 }, instant ? 0 : 0.25)
          .fromTo(m.querySelector("[data-menu-foot]"), { opacity: 0 }, { opacity: 1, duration: instant ? 0 : 0.5 }, instant ? 0 : 0.5);
      } else if (m.style.display === "flex") {
        gsap.to(m, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: instant ? 0 : 0.55,
          ease: "cinematic",
          onComplete: () => void gsap.set(m, { display: "none" }),
        });
      }
    },
    { dependencies: [open] }
  );

  useEffect(() => {
    const lenis = getLenis();
    const behind = background();
    if (!open) {
      lenis?.start();
      document.documentElement.style.overflow = "";
      behind.forEach((el) => el?.removeAttribute("inert"));
      return;
    }
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    behind.forEach((el) => el?.setAttribute("inert", ""));
    requestAnimationFrame(() => menu.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose(true);
      if (e.key !== "Tab") return;
      // Contain focus: the toggle (now ✕) plus everything inside the menu.
      const items = [toggle.current, ...Array.from(menu.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(Boolean) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const wide = window.matchMedia(`(min-width: ${closeFrom}px)`);
    const onWide = () => wide.matches && onClose(false);
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      behind.forEach((el) => el?.removeAttribute("inert"));
    };
  }, [open, onClose, toggle, closeFrom, background]);

  /** Same-page section links (#technology): close first, then glide there once scrolling is back on. */
  const onLink = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    onClose(false);
    if (!href.startsWith("#")) return;
    e.preventDefault();
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target, { duration: 1.2 });
      else target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  };

  return (
    <div
      ref={menu}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className={cn("fixed inset-0 z-40 hidden flex-col bg-navy pt-[4.5rem] text-mist", closeFrom === 1280 ? "xl:hidden" : "lg:hidden")}
    >
      <div aria-hidden className="h-px w-full shrink-0 bg-cyan shadow-[0_0_14px_rgb(56_189_248/0.9)]" />
      {/* Scrolls on its own (below the bar) when a short screen can't fit everything. */}
      <div data-lenis-prevent data-menu-scroll className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <nav aria-label="Mobile" className="shell flex flex-1 flex-col justify-center py-4">
          <ul>
            {links.map((item) => (
              <li key={item.href} className="overflow-hidden">
                <div data-menu-item>
                  <TransitionLink
                    href={item.href}
                    onClick={onLink(item.href)}
                    aria-current={item.current ? "page" : undefined}
                    className={cn(
                      "font-display block py-[0.6svh] text-[clamp(1.6rem,min(9vw,5.6svh),3.25rem)] leading-[1.12] tracking-[-0.03em]",
                      item.current ? "text-cyan" : "text-mist"
                    )}
                  >
                    {item.label}
                  </TransitionLink>
                </div>
              </li>
            ))}
          </ul>
        </nav>
        <div data-menu-foot className="shell space-y-4 pb-8">
          <Button asChild size="lg" className="w-full">
            <TransitionLink href="/appointment" onClick={() => onClose(false)}>
              Book Appointment
            </TransitionLink>
          </Button>
          <address aria-label="Contact" className="grid gap-2 rounded-2xl border border-mist/10 bg-mist/[0.04] p-4 not-italic md:grid-cols-3 md:gap-4">
            <a href={phoneHref} className="group flex items-center gap-3 py-1">
              <ContactIcon kind="phone" />
              <span className="min-w-0">
                <span className="text-caption block text-mist/55">Call us</span>
                <span className="font-ui block text-sm text-mist group-hover:text-cyan">{siteConfig.phone}</span>
              </span>
            </a>
            <a href={`mailto:${siteConfig.email}`} className="group flex items-center gap-3 py-1">
              <ContactIcon kind="mail" />
              <span className="min-w-0">
                <span className="text-caption block text-mist/55">Email</span>
                <span className="font-ui block text-sm break-all text-mist group-hover:text-cyan md:break-normal">{siteConfig.email}</span>
              </span>
            </a>
            <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 py-1">
              <ContactIcon kind="pin" />
              <span className="min-w-0">
                <span className="text-caption block text-mist/55">
                  Get directions<span className="sr-only"> (opens Google Maps in a new tab)</span>
                </span>
                <span className="font-ui block text-sm text-mist group-hover:text-cyan">
                  {addressLines[0]}, {addressLines[1]}
                </span>
              </span>
            </a>
          </address>
        </div>
      </div>
    </div>
  );
}

function ContactIcon({ kind }: { kind: "phone" | "mail" | "pin" }) {
  return (
    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan/12 text-cyan">
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {kind === "phone" && <path d="M5.2 2.8h2.3l1.2 3.3-1.6 1.1a9.4 9.4 0 0 0 4.5 4.5l1.1-1.6 3.3 1.2v2.3a1.7 1.7 0 0 1-1.8 1.7A13.6 13.6 0 0 1 3.5 4.6a1.7 1.7 0 0 1 1.7-1.8Z" />}
        {kind === "mail" && (
          <>
            <rect x="2.8" y="4.5" width="14.4" height="11" rx="2" />
            <path d="m3.5 5.5 6.5 5 6.5-5" />
          </>
        )}
        {kind === "pin" && (
          <>
            <path d="M10 17.5s5.5-5 5.5-9.3a5.5 5.5 0 0 0-11 0c0 4.3 5.5 9.3 5.5 9.3Z" />
            <circle cx="10" cy="8.2" r="2" />
          </>
        )}
      </svg>
    </span>
  );
}
