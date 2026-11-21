"use client";

import Image from "next/image";
import { useRef } from "react";
import { TextReveal } from "@/components/animations/text-reveal";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { asset } from "@/lib/asset";

/** A cinematic concept scene; the image is generated artwork, not a photograph of the clinic. */
export function HospitalSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const image = root.current?.querySelector<HTMLElement>("[data-care-image]");
    if (!image) return;
    gsap.matchMedia().add(MQ.motion, () => {
      gsap.fromTo(image, { scale: 1.1, yPercent: -2 }, {
        scale: 1,
        yPercent: 2,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.7 },
      });
    });
  }, { scope: root });

  return (
    <section ref={root} id="experience" className="relative isolate min-h-[78svh] overflow-hidden bg-navy text-mist sm:min-h-[88svh]">
      <div data-care-image className="absolute inset-0 -z-20 origin-center">
        <Image
          src={asset("/images/clinic-concept.webp")}
          alt="Concept artwork of a calm, modern dental treatment room"
          fill
          sizes="100vw"
          unoptimized
          className="object-cover object-center"
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/90 via-navy/45 to-navy/5" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/80 via-transparent to-navy/15" />

      <div className="shell flex min-h-[78svh] flex-col justify-between py-9 sm:min-h-[88svh] sm:py-12">
        <div className="flex items-center justify-between gap-5">
          <span className="font-ui text-caption tracking-[0.18em] text-mist/75">THE RR DENTAL EXPERIENCE</span>
          <span className="rounded-full border border-white/30 bg-navy/35 px-3 py-1.5 text-[0.68rem] tracking-[0.12em] text-white/75 backdrop-blur">CONCEPT INTERIOR IMAGE</span>
        </div>
        <div className="max-w-3xl pb-4 sm:pb-8">
          <TextReveal as="p" className="font-ui text-caption mb-5 tracking-[0.2em] text-cyan">CARE, WITH ROOM TO BREATHE</TextReveal>
          <TextReveal as="h2" className="font-display text-display-xl max-w-[12ch]">Care that feels different.</TextReveal>
          <TextReveal as="p" delay={0.12} className="text-lead mt-7 max-w-[38ch] text-mist/75">
            A thoughtful visit starts with listening, a clear plan and time to understand your options.
          </TextReveal>
        </div>
      </div>
    </section>
  );
}
