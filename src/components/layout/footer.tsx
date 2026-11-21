import { CurrentYear } from "@/components/layout/current-year";
import { BackToTop } from "@/components/layout/back-to-top";
import { TransitionLink } from "@/components/animations/transition-link";
import { TextReveal } from "@/components/animations/text-reveal";
import { addressLines, directionsHref, mainNav, phoneHref, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** `light`: white background with navy text (used on the Oravie page); otherwise the navy footer. */
export function Footer({ light = false }: { light?: boolean }) {
  // Colours per tone. Light links use a deeper blue than the brand cyan so they stay readable on white.
  const t = light
    ? {
        // Every piece of text in #071b35; links show the template blue only on hover, cyan stays for accents.
        root: "bg-white text-[#071b35] [&_button]:text-[#071b35] [&_button:hover]:text-[#0d74d1]",
        muted: "text-[#071b35]",
        strong: "text-[#071b35] hover:text-[#0d74d1]",
        accent: "text-[#071b35] hover:text-[#0d74d1]",
        navLink: "text-[#071b35] hover:text-[#0d74d1]",
        mark: "text-[#071b35]",
        bar: "border-[#22c6f6]/30 text-[#071b35]",
      }
    : {
        root: "bg-navy",
        muted: "text-mist/70",
        strong: "text-mist",
        accent: "text-cyan",
        navLink: "text-mist/75 hover:text-mist",
        mark: "text-ice/80",
        bar: "border-mist/10 text-mist/50",
      };

  return (
    <footer className={cn("relative overflow-hidden", t.root)}>
      <div className="shell grid gap-14 pt-24 pb-12 lg:grid-cols-12 lg:gap-8 lg:pt-32">
        <div className="lg:col-span-5">
          {light && <span aria-hidden className="mb-5 block h-[3px] w-14 rounded-full bg-gradient-to-r from-[#19cdf6] to-[#1482e6] shadow-[0_0_12px_rgb(34_198_246/0.6)]" />}
          <h2 className="font-display text-display-m">Visit the clinic</h2>
          <address className={cn("mt-6 space-y-0.5 not-italic", t.muted)}>
            <p className="mb-2">
              {addressLines.map((line, i) => (
                <span key={line} className="block">
                  {line}
                  {i === 0 && <span className="sr-only">,</span>}
                </span>
              ))}
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("link-draw mt-1 inline-block py-1.5", t.accent)}
              >
                Get directions<span className="sr-only"> (opens Google Maps in a new tab)</span>
              </a>
            </p>
            <p>
              <a href={phoneHref} className={cn("link-draw inline-block py-1.5", t.strong)}>
                {siteConfig.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${siteConfig.email}`} className={cn("link-draw inline-block py-1.5", t.strong)}>
                {siteConfig.email}
              </a>
            </p>
          </address>
        </div>

        <nav aria-label="Footer" className="lg:col-span-3 lg:col-start-8">
          <ul className="font-ui space-y-0.5 text-[0.95rem]">
            {mainNav.map((i) => (
              <li key={i.href}>
                <TransitionLink href={i.href} className={cn("link-draw inline-block py-1.5 transition-colors", t.navLink)}>
                  {i.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-2 lg:justify-self-end">
          <TransitionLink
            href="/appointment"
            className={cn(
              "font-ui inline-block text-[0.95rem]",
              light
                ? "whitespace-nowrap rounded-full bg-gradient-to-r from-[#19cdf6] to-[#0db1ec] px-6 py-3 font-semibold text-[#071b35] shadow-[0_10px_30px_-10px_rgb(25_205_246/0.9),inset_0_1px_0_rgb(255_255_255/0.45)] transition-[filter] hover:brightness-105"
                : cn("link-draw py-1.5", t.accent)
            )}
          >
            Book a consultation
          </TransitionLink>
        </div>
      </div>

      {/* Oversized wordmark — letters rise out of the baseline as the footer arrives */}
      <div aria-hidden className="pointer-events-none select-none px-[var(--gutter)]">
        <TextReveal
          type="chars"
          stagger={0.03}
          start="top 98%"
          className={cn("font-display text-center text-[15vw] leading-[0.82] font-[360] tracking-[-0.06em] whitespace-nowrap [mask-image:linear-gradient(to_bottom,black_20%,transparent_92%)]", t.mark)}
        >
          {siteConfig.name}
        </TextReveal>
      </div>

      <div className={cn("shell text-caption flex items-center justify-between border-t py-6", t.bar)}>
        <p>
          © <CurrentYear /> {siteConfig.name}
        </p>
        <BackToTop />
      </div>
    </footer>
  );
}
