"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { TextReveal } from "@/components/animations/text-reveal";
import type { AnatomyPart } from "@/components/three/anatomy-scene";
import { cn } from "@/lib/utils";

const parts: { name: AnatomyPart; description: string; note: string }[] = [
  { name: "Enamel", description: "The hard outer covering that protects the visible crown of a tooth.", note: "Enamel does not grow back once it is lost." },
  { name: "Dentin", description: "The layer beneath enamel that makes up most of the tooth structure.", note: "Dentin can feel sensitive when it is exposed." },
  { name: "Pulp", description: "Soft tissue inside the tooth that contains nerves and blood vessels.", note: "The pulp is shown here as an educational 3D layer." },
  { name: "Root", description: "The part of the tooth held within the jaw, supporting it in place.", note: "Root shape and number vary between teeth." },
];

const AnatomyScene = dynamic(() => import("@/components/three/anatomy-scene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_42%,rgb(56_189_248/0.17),transparent_58%)]" />,
});

export function AnatomySection() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState<AnatomyPart>("Enamel");
  const [near, setNear] = useState(false);
  const selected = parts.find((part) => part.name === active) ?? parts[0];

  useEffect(() => {
    const target = section.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "450px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={section} id="anatomy" className="relative overflow-hidden bg-navy py-24 text-mist sm:py-32 lg:py-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [background:radial-gradient(50rem_36rem_at_73%_48%,rgb(56_189_248/0.12),transparent_70%)]" />
      <div className="shell relative">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <TextReveal as="p" className="font-ui text-caption tracking-[0.2em] text-cyan lg:col-span-3">A CLOSER LOOK</TextReveal>
          <TextReveal as="h2" className="font-display text-display-l max-w-[12ch] lg:col-span-7 lg:col-start-4">
            Beyond the surface.
          </TextReveal>
          <TextReveal as="p" delay={0.1} className="max-w-[42ch] text-mist/65 lg:col-span-5 lg:col-start-8">
            Rotate the model and explore the parts of a tooth. Choose a label to see a simplified educational view.
          </TextReveal>
        </div>

        <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-12 lg:items-center">
          <div className="relative isolate min-h-[22rem] overflow-hidden rounded-[2rem] border border-mist/10 bg-ocean/55 sm:min-h-[31rem] lg:col-span-7 lg:min-h-[39rem]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgb(56_189_248/0.1),transparent_65%)]" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-[10%] rounded-full border border-mist/[0.07]" />
            {near ? <AnatomyScene activePart={active} onSelect={setActive} /> : <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_50%_45%,rgb(56_189_248/0.14),transparent_55%)]" />}
            <p className="font-ui text-caption absolute bottom-5 left-5 text-mist/50">Drag to rotate · Scroll or pinch to zoom</p>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <p className="font-ui text-caption tracking-[0.16em] text-ice/60">EXPLORE THE ANATOMY</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {parts.map((part, index) => (
                <button
                  key={part.name}
                  type="button"
                  aria-pressed={active === part.name}
                  onClick={() => setActive(part.name)}
                  className={cn(
                    "font-ui flex min-h-14 items-center gap-3 rounded-xl border px-4 text-left text-sm transition-colors",
                    active === part.name ? "border-cyan/60 bg-cyan/10 text-mist" : "border-mist/10 bg-mist/[0.025] text-mist/65 hover:border-mist/25 hover:text-mist",
                  )}
                >
                  <span className={cn("text-caption tabular", active === part.name ? "text-cyan" : "text-mist/35")}>0{index + 1}</span>
                  {part.name}
                </button>
              ))}
            </div>
            <div aria-live="polite" className="mt-5 min-h-48 rounded-2xl border border-mist/10 bg-mist/[0.035] p-6 sm:p-7">
              <p className="font-ui text-caption text-cyan">TOOTH ANATOMY</p>
              <h3 className="font-display mt-3 text-3xl">{selected.name}</h3>
              <p className="mt-3 leading-relaxed text-mist/70">{selected.description}</p>
              <p className="text-caption mt-5 border-t border-mist/10 pt-4 text-mist/45">{selected.note}</p>
            </div>
            <p className="text-caption mt-5 max-w-[42ch] text-mist/45">Educational visualization only. It is not a diagnostic tool and does not replace an examination by a dental professional.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
