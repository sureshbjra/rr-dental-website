"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { TextReveal } from "@/components/animations/text-reveal";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/animations/transition-link";
import type { ImplantPart } from "@/components/three/implant-experience";
import { cn } from "@/lib/utils";

const implantParts: { name: ImplantPart; descriptor: string }[] = [
  { name: "Crown", descriptor: "The visible restoration" },
  { name: "Abutment", descriptor: "The connector" },
  { name: "Implant fixture", descriptor: "The part placed in bone" },
];

const ImplantExperience = dynamic(() => import("@/components/three/implant-experience"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_45%,rgb(56_189_248/0.18),transparent_60%)]" />,
});

export function ImplantSection() {
  const section = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [selected, setSelected] = useState<ImplantPart[]>(implantParts.map((part) => part.name));

  useEffect(() => {
    const target = section.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "400px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function togglePart(part: ImplantPart) {
    setSelected((current) => current.includes(part) ? current.filter((item) => item !== part) : [...current, part]);
  }

  return (
    <section ref={section} id="implant" className="relative overflow-hidden bg-[#0a294a] py-24 text-mist sm:py-32 lg:py-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [background:radial-gradient(46rem_34rem_at_80%_48%,rgb(56_189_248/0.13),transparent_68%)]" />
      <div className="shell relative grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <TextReveal as="p" className="font-ui text-caption tracking-[0.18em] text-cyan">A CLOSER LOOK AT IMPLANTS</TextReveal>
          <TextReveal as="h2" className="font-display text-display-l mt-5 max-w-[11ch]">Designed in parts. Planned as one.</TextReveal>
          <TextReveal as="p" delay={0.1} className="text-lead mt-6 max-w-[38ch] text-mist/65">
            Explore a simplified 3D model of a crown, connector and implant fixture. A consultation helps determine which options may suit you.
          </TextReveal>

          <div className="mt-9 space-y-2">
            {implantParts.map((part, index) => (
              <button
                key={part.name}
                type="button"
                aria-pressed={selected.includes(part.name)}
                onClick={() => togglePart(part.name)}
                className={cn("flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors", selected.includes(part.name) ? "border-cyan/35 bg-cyan/[0.07]" : "border-mist/10 bg-transparent opacity-55")}
              >
                <span className="font-ui text-caption tabular text-cyan">0{index + 1}</span>
                <span className="flex-1">
                  <span className="font-ui block text-sm text-mist">{part.name}</span>
                  <span className="text-caption block text-mist/50">{part.descriptor}</span>
                </span>
                <span aria-hidden="true" className={cn("size-2 rounded-full", selected.includes(part.name) ? "bg-cyan shadow-[0_0_12px_rgb(56_189_248/0.8)]" : "bg-mist/25")} />
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button type="button" variant="outline" onClick={() => setExploded((value) => !value)}>
              {exploded ? "Connect components" : "Separate components"}
            </Button>
            <Button asChild variant="link" className="text-mist">
              <TransitionLink href="/appointment">Ask about implant options</TransitionLink>
            </Button>
          </div>
          <p className="text-caption mt-5 max-w-[42ch] text-mist/42">Illustrative model only. Real components and treatment plans vary; your dentist will explain the options for your case.</p>
        </div>

        <div className="relative isolate min-h-[24rem] overflow-hidden rounded-[2rem] border border-mist/10 bg-navy/40 sm:min-h-[34rem] lg:col-span-6 lg:col-start-7 lg:min-h-[42rem]">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgb(56_189_248/0.12),transparent_66%)]" />
          <div aria-hidden="true" className="absolute inset-x-[15%] top-[50%] h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          {near && <ImplantExperience exploded={exploded} selected={selected} />}
          <p className="font-ui text-caption absolute bottom-5 left-5 text-mist/45">Drag to rotate · Select a part to show or hide it</p>
        </div>
      </div>
    </section>
  );
}
