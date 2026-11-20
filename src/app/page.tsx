import { HeroSection } from "@/components/hero/hero-section";
import { LightChapter } from "@/components/sections/light-chapter";
import { IntroStatement } from "@/components/sections/intro-statement";
import { TreatmentsSection } from "@/components/treatments/treatments-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { ProcessSection } from "@/components/sections/process-section";
import { CtaSection } from "@/components/sections/cta-section";

export default function Home() {
  return (
    <>
      {/* Scan room → clinic → lab → journey → close */}
      <HeroSection />
      <LightChapter>
        <IntroStatement />
        <TreatmentsSection />
      </LightChapter>
      <TechnologySection />
      <ProcessSection />
      <CtaSection />
    </>
  );
}
