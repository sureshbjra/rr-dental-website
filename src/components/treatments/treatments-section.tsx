"use client";

import { useId, useState } from "react";
import { Button, Roll } from "@/components/ui/button";
import { TextReveal } from "@/components/animations/text-reveal";
import { StaggerReveal } from "@/components/animations/stagger-reveal";
import { TransitionLink } from "@/components/animations/transition-link";
import { treatments } from "@/config/content";
import { cn } from "@/lib/utils";

/**
 * Treatments as an index you open, not a card grid. Each row is a real button (aria-expanded);
 * opening it eases the detail in. On hover a cyan scan line draws across the row's rule.
 */
export function TreatmentsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="shell section-y grid gap-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-16">
      <TextReveal as="h2" className="font-display text-display-l lg:col-span-12">
        Treatments
      </TextReveal>
      <div className="lg:col-span-4 lg:pr-8">
        <div className="lg:sticky lg:top-32">
          <TextReveal as="p" delay={0.12} className="text-lead max-w-[30ch] text-navy/65">
            Six ways we look after your teeth. Open one to see what it involves.
          </TextReveal>
          <Button asChild variant="inverse" className="mt-9 hidden lg:inline-flex">
            <TransitionLink href="/appointment">
              <Roll>Book a consultation</Roll>
            </TransitionLink>
          </Button>
        </div>
      </div>

      <StaggerReveal as="ul" variant="fade" stagger={0.06} className="border-t border-navy/15 lg:col-span-8">
        {treatments.map((t, i) => {
          const open = openIndex === i;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <li key={t.title} data-stagger className="group/row relative border-b border-navy/15">
              {/* scan line across the rule on hover / when open */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-cyan shadow-[0_0_10px_rgb(56_189_248/0.8)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:scale-x-100",
                  open && "scale-x-100"
                )}
              />
              <h3>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-6 py-6 text-left sm:py-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto]"
                >
                  <span className="font-display text-display-m transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:translate-x-2">
                    {t.title}
                  </span>
                  <span className="hidden text-navy/60 md:block">{t.summary}</span>
                  {/* plus → minus */}
                  <span aria-hidden className="relative block size-5 shrink-0">
                    <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-navy" />
                    <span
                      className={cn(
                        "absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-navy transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        open && "scale-y-0"
                      )}
                    />
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-label={t.title}
                inert={!open}
                className={cn(
                  "grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <div
                    className={cn(
                      "grid gap-5 pb-8 transition-[opacity,transform] duration-500 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] md:gap-6",
                      open ? "translate-y-0 opacity-100 delay-150" : "translate-y-3 opacity-0"
                    )}
                  >
                    <p className="text-lead max-w-[44ch] text-navy/75 md:col-start-1">{t.detail}</p>
                    <div className="md:col-start-2">
                      <TransitionLink href="/appointment" className="font-ui link-draw inline-block py-2 text-sm">
                        Ask about {t.title.toLowerCase()}
                      </TransitionLink>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </StaggerReveal>
    </div>
  );
}
