import { TextReveal } from "@/components/animations/text-reveal";
import { AppointmentForm } from "@/components/appointment/appointment-form";

export function AppointmentSection() {
  return (
    <section id="booking" className="bg-mist py-24 text-navy sm:py-32 lg:py-40">
      <div className="shell">
        <div className="grid gap-5 border-b border-navy/10 pb-9 lg:grid-cols-12 lg:items-end lg:pb-12">
          <TextReveal as="p" className="font-ui text-caption tracking-[0.18em] text-navy/50 lg:col-span-3">YOUR NEXT STEP</TextReveal>
          <TextReveal as="h2" className="font-display text-display-l max-w-[12ch] lg:col-span-7 lg:col-start-4">A conversation comes first.</TextReveal>
        </div>
        <div className="pt-9 lg:pt-12">
          <AppointmentForm />
        </div>
      </div>
    </section>
  );
}
