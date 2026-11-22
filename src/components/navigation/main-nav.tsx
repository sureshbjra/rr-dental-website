"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Roll } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { TransitionLink } from "@/components/animations/transition-link";
import { MenuIcon, SiteMenu } from "@/components/navigation/site-menu";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { mainNav, siteConfig } from "@/config/site";

/**
 * Full-width bar: transparent over the hero, frosted once you scroll, navy text (`data-light`) while
 * a light section is under it — <LightChapter>, or any section marked `data-nav-light`. Hides on
 * scroll down, returns on scroll up.
 * Below 1280px the links move into the full-screen menu (<SiteMenu>, shared with the home page),
 * opened by the animated ☰ / ✕ toggle.
 */
export function MainNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const openRef = useRef(open);
  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggle.current?.focus();
  }, []);
  const background = useCallback(() => [document.getElementById("main"), document.querySelector("footer")], []);

  // The bar's hide-on-scroll reads this (it stays put while the menu is open).
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // ----------------------------------------------------------------- light sections (per page)
  // Mist sections (e.g. the Treatments page) would otherwise leave the white logo and ☰ invisible.
  useGSAP(
    () => {
      const el = header.current;
      if (!el) return;
      // Filled before any trigger can fire: ScrollTrigger may call onToggle while creating one.
      const triggers: ScrollTrigger[] = [];
      const update = () => el.toggleAttribute("data-light", triggers.some((t) => t.isActive));
      for (const section of gsap.utils.toArray<HTMLElement>("main [data-nav-light]")) {
        triggers.push(ScrollTrigger.create({ trigger: section, start: "top 36px", end: "bottom 36px", onToggle: update }));
      }
      update();
      return () => el.removeAttribute("data-light");
    },
    { dependencies: [pathname] }
  );

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

  const links = [{ label: "Home", href: "/" }, ...mainNav].map((item) => ({ ...item, current: pathname === item.href }));

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
              className="menu-toggle flex size-11 items-center justify-center rounded-full xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <MenuIcon open={open} />
            </button>
          </div>
        </div>
      </header>

      {/* Outside <header>: the header is transformed when it hides, which would trap a fixed overlay. */}
      <SiteMenu id="mobile-menu" open={open} onClose={close} toggle={toggle} links={links} closeFrom={1280} background={background} />
    </>
  );
}
