import { ArrowUpRight, UserRound } from "lucide-react";
import { TextReveal } from "@/components/animations/text-reveal";
import { StaggerReveal } from "@/components/animations/stagger-reveal";
import { TransitionLink } from "@/components/animations/transition-link";

const profiles = ["01", "02", "03"];

/** Intentionally uses profile placeholders until the clinic supplies approved staff details. */
export function DoctorsSection() {
  return (
    <section id="doctors" className="bg-mist py-24 text-navy sm:py-32 lg:py-40">
      <div className="shell">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <TextReveal as="p" className="font-ui text-caption tracking-[0.18em] text-navy/50 lg:col-span-3">THE PEOPLE BEHIND YOUR CARE</TextReveal>
          <TextReveal as="h2" className="font-display text-display-l max-w-[12ch] lg:col-span-6 lg:col-start-4">Expertise you can trust.</TextReveal>
          <TextReveal as="p" delay={0.12} className="max-w-[35ch] text-navy/60 lg:col-span-3 lg:col-start-10">
            Meet the clinicians who will guide your care. Profile details are placeholders for the clinic to complete.
          </TextReveal>
        </div>

        <StaggerReveal as="ul" variant="fade" stagger={0.1} className="mt-12 grid gap-4 md:grid-cols-3 lg:mt-16">
          {profiles.map((number) => (
            <li key={number} data-stagger>
              <article className="group h-full overflow-hidden rounded-[1.6rem] border border-navy/10 bg-white/65 transition-transform duration-500 hover:-translate-y-1">
                <div className="relative flex aspect-[1.15] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,rgb(56_189_248/0.2),transparent_58%),linear-gradient(145deg,#dceef9,#eff8fc_52%,#dce8f0)]">
                  <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgb(7_27_53/0.12)_1px,transparent_1px),linear-gradient(90deg,rgb(7_27_53/0.12)_1px,transparent_1px)] [background-size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
                  <div className="relative flex size-32 items-center justify-center rounded-full border border-white/70 bg-white/55 shadow-[0_18px_50px_-25px_rgb(7_27_53/0.45)] backdrop-blur-sm sm:size-36">
                    <UserRound aria-hidden="true" className="size-14 stroke-[1.1] text-navy/45" />
                  </div>
                  <span className="font-ui text-[0.65rem] tracking-[0.15em] absolute bottom-4 left-4 rounded-full bg-white/70 px-3 py-1.5 text-navy/55">PROFILE IMAGE PLACEHOLDER</span>
                  <span aria-hidden="true" className="absolute right-5 top-5 font-display text-4xl text-navy/20">{number}</span>
                </div>
                <div className="p-6 sm:p-7">
                  <p className="font-ui text-caption text-navy/45">CLINICIAN PROFILE {number}</p>
                  <h3 className="font-display mt-2 text-3xl">Add doctor name</h3>
                  <dl className="mt-5 space-y-3 border-t border-navy/10 pt-4 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-navy/45">Qualification</dt><dd className="text-right text-navy/75">Add verified details</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-navy/45">Specialization</dt><dd className="text-right text-navy/75">Confirm with clinic</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-navy/45">Experience</dt><dd className="text-right text-navy/75">Add verified years</dd></div>
                  </dl>
                  <TransitionLink href="/appointment" className="font-ui link-draw mt-6 inline-flex items-center gap-2 text-sm text-navy">
                    Book a consultation <ArrowUpRight aria-hidden="true" className="size-4" />
                  </TransitionLink>
                </div>
              </article>
            </li>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
