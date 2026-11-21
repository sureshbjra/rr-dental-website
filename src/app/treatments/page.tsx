import type { Metadata } from "next";
import { TransitionLink } from "@/components/animations/transition-link";
import { TreatmentsSection } from "@/components/treatments/treatments-section";

const title = "Treatments";
const description = "Everything we offer, what's involved, and how long it takes.";

export const metadata: Metadata = { title, description };

export default function Page() {
  return (
    <div className="bg-mist text-navy">
      <section className="shell mx-auto max-w-7xl pt-36 pb-10 sm:pt-44 sm:pb-14">
        <p className="font-ui text-caption tracking-[0.22em] text-navy/70">CARE OVERVIEW</p>
        <div className="mt-5 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <h1 className="font-display max-w-[12ch] text-display-xl leading-[0.92] tracking-[-0.05em]">Treatments for every smile.</h1>
          <div className="max-w-[42ch] md:justify-self-end">
            <p className="text-lead text-navy/70">{description} Your dentist will help you understand the options that fit your needs and goals.</p>
            <TransitionLink href="/" className="font-ui link-draw mt-5 inline-flex items-center gap-2 pb-2 text-sm text-navy">
              Back to the home page <span aria-hidden="true">↗</span>
            </TransitionLink>
          </div>
        </div>
      </section>
      <TreatmentsSection />
    </div>
  );
}
