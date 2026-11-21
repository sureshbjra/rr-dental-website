import type { Metadata } from "next";
import { TextReveal } from "@/components/animations/text-reveal";
import { AppointmentForm } from "@/components/appointment/appointment-form";

const title = "Book a consultation";
const description = "Choose a time that suits you. Your first visit includes a 3D scan and a written plan.";

export const metadata: Metadata = { title, description };

export default function Page() {
  return (
    <>
      <section className="relative isolate bg-navy text-mist">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(54rem_34rem_at_78%_36%,rgb(56_189_248/0.15),transparent_66%)]" />
        <div className="shell grid gap-8 pt-36 pb-12 lg:grid-cols-12 lg:items-end lg:pt-48 lg:pb-16">
          <TextReveal as="p" trigger="load" className="font-ui text-caption tracking-[0.18em] text-cyan lg:col-span-3">LET’S START WITH A CONVERSATION</TextReveal>
          <TextReveal as="h1" trigger="load" delay={0.08} className="font-display text-display-xl max-w-[11ch] lg:col-span-8 lg:col-start-4">{title}.</TextReveal>
          <TextReveal as="p" trigger="load" delay={0.18} className="text-lead max-w-[39ch] text-mist/65 lg:col-span-6 lg:col-start-4">
            Share a preferred time and what you would like to discuss. The clinic can confirm availability and help you decide what comes next.
          </TextReveal>
        </div>
      </section>
      <section className="bg-mist py-16 text-navy sm:py-24">
        <div className="shell"><AppointmentForm /></div>
      </section>
    </>
  );
}
