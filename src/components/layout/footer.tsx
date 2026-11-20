import { CurrentYear } from "@/components/layout/current-year";
import { BackToTop } from "@/components/layout/back-to-top";
import { TransitionLink } from "@/components/animations/transition-link";
import { TextReveal } from "@/components/animations/text-reveal";
import { addressLines, directionsHref, mainNav, phoneHref, siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy">
      <div className="shell grid gap-14 pt-24 pb-12 lg:grid-cols-12 lg:gap-8 lg:pt-32">
        <div className="lg:col-span-5">
          <h2 className="font-display text-display-m">Visit the clinic</h2>
          <address className="mt-6 space-y-0.5 not-italic text-mist/70">
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
                className="link-draw mt-1 inline-block py-1.5 text-cyan"
              >
                Get directions<span className="sr-only"> (opens Google Maps in a new tab)</span>
              </a>
            </p>
            <p>
              <a href={phoneHref} className="link-draw inline-block py-1.5 text-mist">
                {siteConfig.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${siteConfig.email}`} className="link-draw inline-block py-1.5 text-mist">
                {siteConfig.email}
              </a>
            </p>
          </address>
        </div>

        <nav aria-label="Footer" className="lg:col-span-3 lg:col-start-8">
          <ul className="font-ui space-y-0.5 text-[0.95rem]">
            {mainNav.map((i) => (
              <li key={i.href}>
                <TransitionLink href={i.href} className="link-draw inline-block py-1.5 text-mist/75 transition-colors hover:text-mist">
                  {i.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-2 lg:justify-self-end">
          <TransitionLink href="/appointment" className="font-ui link-draw inline-block py-1.5 text-[0.95rem] text-cyan">
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
          className="font-display text-center text-[15vw] leading-[0.82] font-[360] tracking-[-0.06em] whitespace-nowrap text-ice/80 [mask-image:linear-gradient(to_bottom,black_20%,transparent_92%)]"
        >
          {siteConfig.name}
        </TextReveal>
      </div>

      <div className="shell text-caption flex items-center justify-between border-t border-mist/10 py-6 text-mist/50">
        <p>
          © <CurrentYear /> {siteConfig.name}
        </p>
        <BackToTop />
      </div>
    </footer>
  );
}
