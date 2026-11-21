import type { Metadata } from "next";
import { OraviePage } from "@/components/oravie/oravie-page";
import { oravieFont } from "@/components/oravie/oravie-font";
import "@/components/oravie/oravie.css";

/*
 * Home page: the Oravie design (3D tooth hero, treatments, technology, the clinic, the care journey,
 * results). The earlier home sections (scan-room hero, anatomy, implant, doctors, testimonials,
 * appointment, closing call to action) still exist as components and can be added to it again.
 */
export const metadata: Metadata = {
  title: { absolute: "RR Dental Hospital — Your Smile. Our Innovation." },
  description:
    "Experience modern dentistry with precision, innovation and personalized care: implants, braces, cleaning, root canal treatment, crowns, bridges and whitening.",
};

export default function Home() {
  return <OraviePage fontClass={oravieFont.variable} />;
}
