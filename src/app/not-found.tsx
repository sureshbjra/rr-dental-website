import type { Metadata } from "next";
import { Button, Roll } from "@/components/ui/button";
import { TransitionLink } from "@/components/animations/transition-link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(50rem_30rem_at_80%_10%,rgb(56_189_248/0.12),transparent_65%)]"
      />
      <div className="shell grid min-h-[80svh] content-end gap-8 pt-40 pb-24">
        <p className="font-ui text-caption text-mist/60">Error 404</p>
        <h1 className="font-display text-display-xl max-w-[12ch]">This page isn&apos;t here.</h1>
        <div aria-hidden className="h-px w-full max-w-xl bg-cyan shadow-[0_0_14px_rgb(56_189_248/0.8)]" />
        <p className="text-lead max-w-[40ch] text-mist/75">
          The link may be out of date, or the page may have moved. Start again from the home page, or book a consultation.
        </p>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <Button asChild size="lg">
            <TransitionLink href="/">
              <Roll>Go to the home page</Roll>
            </TransitionLink>
          </Button>
          <Button asChild variant="link" className="text-mist">
            <TransitionLink href="/appointment">Book a consultation</TransitionLink>
          </Button>
        </div>
      </div>
    </section>
  );
}
