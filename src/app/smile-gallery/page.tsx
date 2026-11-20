import type { Metadata } from "next";
import { TextReveal } from "@/components/animations/text-reveal";
import { TransitionLink } from "@/components/animations/transition-link";
import { SmileGallery } from "@/components/gallery/smile-gallery";
import { Button, Roll } from "@/components/ui/button";

const title = "Smile gallery";
const description = "Before-and-after results from real treatments, shared with our patients' permission.";

export const metadata: Metadata = { title, description };

export default function Page() {
  return (
    <>
      <section className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(50rem_30rem_at_85%_0%,rgb(56_189_248/0.12),transparent_65%)]"
        />
        <div className="shell grid gap-10 pt-40 pb-16 lg:grid-cols-12 lg:pb-20">
          <TextReveal as="h1" trigger="load" className="font-display text-display-xl lg:col-span-12">
            {title}
          </TextReveal>
          <TextReveal as="p" trigger="load" delay={0.3} className="text-lead max-w-[40ch] text-mist/70 lg:col-span-6">
            {description}
          </TextReveal>
        </div>
      </section>

      <SmileGallery />

      <section className="shell grid gap-10 border-t border-mist/10 py-24 lg:grid-cols-12 lg:py-32">
        <TextReveal as="h2" className="font-display text-display-l lg:col-span-7">
          Your own plan starts with a scan.
        </TextReveal>
        <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
          <p className="text-mist/70">
            At your consultation we scan your teeth and show you, in 3D, what treatment would involve before anything
            begins.
          </p>
          <Button asChild size="lg" className="mt-8">
            <TransitionLink href="/appointment">
              <Roll>Book a consultation</Roll>
            </TransitionLink>
          </Button>
          <p className="text-caption mt-8 text-mist/60">Every mouth is different, so individual results vary.</p>
        </div>
      </section>
    </>
  );
}
