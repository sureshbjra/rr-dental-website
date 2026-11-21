"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Roll } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { TransitionLink } from "@/components/animations/transition-link";
import { gsap, MQ, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/scroll-state";
import { addressLines, directionsHref, mainNav, phoneHref, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-width bar: transparent over the hero, frosted once you scroll, navy text over the light
 * chapter (`data-light`, set by <LightChapter>). Hides on scroll down, returns on scroll up.
 * Below 1280px the links move into a full-screen menu — a modal dialog: focus moves in, Tab is
 * contained, Escape closes, focus returns to the toggle and the page behind is inert. The link size
 * follows the screen height so every item (Contact included) and the contact details fit; on very
 * short screens the menu scrolls below the bar.
 */
export function MainNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const openRef = useRef(open);

  // ----------------------------------------------------------------- bar behaviour
  useGSAP(
    () => {
      const el = header.current;
      if (!el) return;
      ScrollTrigger.create({
        start: 40,
        end: "max",
        onToggle: (self) => el.toggleAttribute("data-scrolled", self.isActive),
      });
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap.from(el.querySelectorAll("[data-nav-item]"), { y: -20, opacity: 0, duration: 1, ease: "reveal", stagger: 0.06, delay: 0.1 });
        const hide = gsap.to(el, { yPercent: -110, duration: 0.5, ease: "power3.inOut", paused: true });
        ScrollTrigger.create({
          start: 160,
          end: "max",
          onUpdate: (self) => {
            if (openRef.current) return;
            if (self.direction === 1) hide.play();
            else hide.reverse();
          },
          onLeaveBack: () => hide.reverse(),
        });
        // Keyboard users tabbing into a hidden bar get it back.
        const reveal = () => hide.reverse();
        el.addEventListener("focusin", reveal);
        return () => el.removeEventListener("focusin", reveal);
      });
    },
    { scope: header }
  );

  // ----------------------------------------------------------------- menu open / close
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
    openRef.current = open;
    const lenis = getLenis();
    const background = [document.getElementById("main"), document.querySelector("footer")];
    if (open) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
      background.forEach((el) => el?.setAttribute("inert", ""));
      requestAnimationFrame(() => menu.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus());
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
      background.forEach((el) => el?.removeAttribute("inert"));
    }
    if (!open) return;

    const close = (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) toggle.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close(true);
      if (e.key !== "Tab") return;
      // Contain focus: the toggle (now "Close") plus everything inside the menu.
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
    const wide = window.matchMedia("(min-width: 1280px)");
    const onWide = () => wide.matches && close(false);
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  const links = [{ label: "Home", href: "/" }, ...mainNav];

  return (
    <>
      <header
        ref={header}
        className="group/nav fixed inset-x-0 top-0 z-50 text-mist transition-colors duration-500 data-[light]:text-navy"
        style={open ? { color: "var(--brand-mist)" } : undefined}
      >
        {/* Frosted backdrop, only after scrolling */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 border-b border-transparent bg-navy/55 opacity-0 transition-[opacity,background-color,border-color] duration-500 [backdrop-filter:blur(18px)_saturate(150%)] group-data-[scrolled]/nav:border-mist/10 group-data-[scrolled]/nav:opacity-100 group-data-[light]/nav:border-navy/10 group-data-[light]/nav:bg-mist/70"
        />
        <div className="shell relative flex h-[4.5rem] items-center justify-between lg:h-20">
          <TransitionLink href="/" data-nav-item aria-label={`${siteConfig.name} — home`} className="-my-2 py-2" onClick={() => setOpen(false)}>
            <Logo />
          </TransitionLink>

          <nav aria-label="Main" className="hidden xl:block">
            <ul className="font-ui flex items-center gap-7 text-[0.9rem]">
              {mainNav.map((item) => (
                <li key={item.href} data-nav-item>
                  <TransitionLink
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="link-draw inline-block py-2 opacity-80 transition-opacity hover:opacity-100 aria-[current=page]:opacity-100"
                  >
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2" data-nav-item>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <TransitionLink href="/appointment">
                <Roll>Book Appointment</Roll>
              </TransitionLink>
            </Button>
            <button
              ref={toggle}
              type="button"
              className="font-ui h-11 min-w-11 rounded-full px-4 text-sm xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      {/* Outside <header>: the header is transformed when it hides, which would trap a fixed overlay. */}
      <div
        ref={menu}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="fixed inset-0 z-40 hidden flex-col bg-navy pt-[4.5rem] text-mist xl:hidden"
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
                      onClick={() => setOpen(false)}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={cn(
                        "font-display block py-[0.6svh] text-[clamp(1.6rem,min(9vw,5.6svh),3.25rem)] leading-[1.12] tracking-[-0.03em]",
                        pathname === item.href ? "text-cyan" : "text-mist"
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
              <TransitionLink href="/appointment" onClick={() => setOpen(false)}>
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
    </>
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
