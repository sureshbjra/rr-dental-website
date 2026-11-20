import { TextReveal } from "@/components/animations/text-reveal";
import { TransitionLink } from "@/components/animations/transition-link";
import { addressLines, directionsHref, phoneHref, siteConfig } from "@/config/site";

const action = "font-ui link-draw inline-block py-2 text-cyan";

/**
 * Inner-page shell: large expanded title revealed on arrival (waits for the page transition).
 * `contact` shows the clinic's address and numbers; `booking` offers phone and email (the booking
 * page can't send people to itself); `default` points to a consultation.
 */
export function PagePlaceholder({
  title,
  description,
  variant = "default",
}: {
  title: string;
  description: string;
  variant?: "default" | "booking" | "contact";
}) {
  return (
    <section className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(50rem_30rem_at_85%_0%,rgb(56_189_248/0.12),transparent_65%)]"
      />
      <div className="shell grid min-h-[78svh] content-end gap-10 pt-40 pb-20 lg:grid-cols-12 lg:pb-28">
        <TextReveal as="h1" trigger="load" className="font-display text-display-xl lg:col-span-12">
          {title}
        </TextReveal>
        <TextReveal as="p" trigger="load" delay={0.3} className="text-lead max-w-[40ch] text-mist/70 lg:col-span-6">
          {description}
        </TextReveal>
        <div className="text-mist/55 lg:col-span-5 lg:col-start-8 lg:self-end">
          {variant === "contact" && (
            <address className="not-italic">
              <p className="text-lead text-mist">
                {addressLines.map((line, i) => (
                  <span key={line} className="block">
                    {line}
                    {i === 0 && <span className="sr-only">,</span>}
                  </span>
                ))}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-6">
                <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={action}>
                  Get directions<span className="sr-only"> (opens Google Maps in a new tab)</span>
                </a>
                <a href={phoneHref} className={action}>
                  Call {siteConfig.phone}
                </a>
                <a href={`mailto:${siteConfig.email}`} className={action}>
                  Email {siteConfig.email}
                </a>
              </div>
            </address>
          )}
          {variant === "booking" && (
            <>
              <p>Online booking is being set up. Call or email us and we&rsquo;ll find a time with you.</p>
              <div className="mt-2 flex flex-wrap gap-x-6">
                <a href={phoneHref} className={action}>
                  Call {siteConfig.phone}
                </a>
                <a href={`mailto:${siteConfig.email}`} className={action}>
                  Email {siteConfig.email}
                </a>
              </div>
            </>
          )}
          {variant === "default" && (
            <>
              <p>This page is being written. Meanwhile, the quickest way to get answers is a consultation.</p>
              <TransitionLink href="/appointment" className={`${action} mt-2`}>
                Book a consultation
              </TransitionLink>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
