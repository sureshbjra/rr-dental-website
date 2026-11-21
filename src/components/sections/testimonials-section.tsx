"use client";

import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { useState } from "react";
import { TextReveal } from "@/components/animations/text-reveal";

const prompts = ["First visit", "Implant consultation", "Smile design"];

/** Carousel content is intentionally blank until consented patient reviews are supplied. */
export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const previous = () => setActive((current) => (current - 1 + prompts.length) % prompts.length);
  const next = () => setActive((current) => (current + 1) % prompts.length);

  return (
    <section id="testimonials" className="relative overflow-hidden bg-[#e6f2f8] py-24 text-navy sm:py-32 lg:py-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [background:radial-gradient(42rem_34rem_at_50%_70%,rgb(56_189_248/0.16),transparent_70%)]" />
      <div className="shell relative grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-4">
          <TextReveal as="p" className="font-ui text-caption tracking-[0.18em] text-navy/55">PATIENT STORIES</TextReveal>
          <TextReveal as="h2" className="font-display text-display-l mt-5 max-w-[9ch]">A better visit, in their words.</TextReveal>
          <TextReveal as="p" delay={0.1} className="mt-6 max-w-[34ch] text-navy/60">
            This demo carousel is ready for feedback shared with each patient’s permission.
          </TextReveal>
          <div className="mt-8 flex gap-3">
            <button type="button" aria-label="Previous testimonial" onClick={previous} className="flex size-12 items-center justify-center rounded-full border border-navy/15 transition-colors hover:bg-navy hover:text-white"><ArrowLeft aria-hidden="true" className="size-4" /></button>
            <button type="button" aria-label="Next testimonial" onClick={next} className="flex size-12 items-center justify-center rounded-full border border-navy/15 transition-colors hover:bg-navy hover:text-white"><ArrowRight aria-hidden="true" className="size-4" /></button>
          </div>
        </div>

        <div className="overflow-hidden lg:col-span-7 lg:col-start-6">
          <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateX(-${active * 100}%)` }}>
            {prompts.map((prompt, index) => (
              <article key={prompt} aria-label={`Testimonial placeholder ${index + 1}`} className="min-w-full rounded-[1.8rem] border border-white/70 bg-white/60 p-7 shadow-[0_30px_70px_-50px_rgb(7_27_53/0.55)] backdrop-blur-sm sm:p-11">
                <div className="flex items-center justify-between">
                  <span className="font-ui text-caption tracking-[0.15em] text-navy/50">{prompt.toUpperCase()}</span>
                  <MessageCircle aria-hidden="true" className="size-7 stroke-[1.25] text-cyan" />
                </div>
                <blockquote className="font-display mt-10 max-w-[22ch] text-3xl leading-tight sm:text-4xl">
                  “Add a patient-approved review here.”
                </blockquote>
                <div className="mt-10 flex items-center justify-between gap-4 border-t border-navy/10 pt-5">
                  <p className="text-caption text-navy/55">Patient name, only with permission</p>
                  <p className="text-caption text-navy/45">Demo placeholder {index + 1} of {prompts.length}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="text-caption mt-4 text-navy/55">No patient reviews are included in this demo. Add consented feedback before launch.</p>
        </div>
      </div>
    </section>
  );
}
