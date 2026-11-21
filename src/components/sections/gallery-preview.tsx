import { ArrowUpRight } from "lucide-react";
import { TextReveal } from "@/components/animations/text-reveal";
import { TransitionLink } from "@/components/animations/transition-link";
import { BeforeAfterSlider } from "@/components/gallery/before-after-slider";
import { galleryCases } from "@/config/gallery";

export function GalleryPreview() {
  const featured = galleryCases[0];
  const [before, after] = featured.photos;

  return (
    <section id="results" className="bg-navy py-24 text-mist sm:py-32 lg:py-40">
      <div className="shell">
        <div className="grid gap-7 lg:grid-cols-12 lg:items-end">
          <TextReveal as="p" className="font-ui text-caption tracking-[0.18em] text-cyan lg:col-span-3">A CLOSER LOOK AT RESULTS</TextReveal>
          <TextReveal as="h2" className="font-display text-display-l max-w-[12ch] lg:col-span-6 lg:col-start-4">Small details. Big confidence.</TextReveal>
          <TextReveal as="p" delay={0.1} className="max-w-[34ch] text-mist/60 lg:col-span-3 lg:col-start-10">
            Explore a sample transformation. Individual outcomes vary and depend on your clinical assessment.
          </TextReveal>
        </div>

        <div className="mt-12 grid gap-7 lg:mt-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <BeforeAfterSlider before={before} after={after} title={featured.title} />
            <p className="text-caption mt-3 text-mist/60">Demo case image · confirm permission and replace with approved patient images before launch.</p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="font-ui text-caption text-cyan">SAMPLE CASE 01</p>
            <h3 className="font-display mt-4 text-4xl sm:text-5xl">{featured.title}</h3>
            <p className="mt-5 max-w-[38ch] text-mist/65">{featured.summary}</p>
            <p className="text-caption mt-5 text-ice/65">Treatment example: {featured.treatment}</p>
            <TransitionLink href="/smile-gallery" className="font-ui link-draw mt-8 inline-flex items-center gap-2 py-2 text-sm text-mist">
              View sample gallery <ArrowUpRight aria-hidden="true" className="size-4" />
            </TransitionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
