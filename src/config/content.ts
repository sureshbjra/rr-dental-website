/**
 * Site copy. PLACEHOLDER CONTENT written for layout and motion — confirm every treatment and piece of
 * equipment with the clinic before going live.
 */

export const heroContent = {
  title: ["Gentle dentistry,", "planned in 3D."],
  text: "We scan, measure and preview your treatment on screen first — so you see exactly what will happen before anything begins.",
  primary: "Book a consultation",
  secondary: "See treatments",
  specimen: "Lower first molar",
};

export const statement =
  "Every plan starts with a 3D scan of your teeth. We show you the options on screen, explain what each one costs, and leave the decision with you.";

export const treatments = [
  {
    title: "Check-ups & cleaning",
    summary: "Regular care that catches problems early.",
    detail: "A full examination, a gentle professional clean and a digital record of your teeth, so small changes are spotted long before they hurt.",
  },
  {
    title: "Cosmetic dentistry",
    summary: "Whitening, bonding and veneers.",
    detail: "Brighter, more even teeth designed around your face. We preview the result on screen with you before any work starts.",
  },
  {
    title: "Dental implants",
    summary: "Permanent replacements for missing teeth.",
    detail: "A titanium root and a natural-looking crown, planned on a 3D scan of your jaw so the implant sits exactly where it should.",
  },
  {
    title: "Clear aligners",
    summary: "Straighter teeth without metal braces.",
    detail: "A series of near-invisible trays moves your teeth gradually. Your scan shows the starting point and the planned finish.",
  },
  {
    title: "Root canal treatment",
    summary: "Saves a painful or infected tooth.",
    detail: "We clean and seal the inside of the tooth under local anaesthetic, using 3D imaging to find every canal.",
  },
  {
    title: "Children's dentistry",
    summary: "Calm first visits and lasting habits.",
    detail: "Unhurried appointments that help children feel at home in the chair, with simple routines to keep up at home.",
  },
] as const;

export type Diagram = "scan" | "smile" | "cbct" | "laser" | "guide";

export const technology: { diagram: Diagram; title: string; text: string }[] = [
  { diagram: "scan", title: "Intraoral scanner", text: "A small wand records your teeth in 3D in a few minutes. No impression trays, and you see the scan on screen straight away." },
  { diagram: "smile", title: "Digital smile design", text: "Photos and scans combine into a preview of your new smile, which we adjust together before treatment." },
  { diagram: "cbct", title: "CBCT imaging", text: "A low-dose 3D X-ray shows bone, nerves and roots, so implants and root canals are planned with certainty." },
  { diagram: "laser", title: "Dental laser", text: "Treats gums and soft tissue with less bleeding, fewer stitches and quicker healing." },
  { diagram: "guide", title: "Guided implant surgery", text: "A printed guide, made from your plan, places each implant at the exact angle and depth designed for it." },
];

export const processSteps = [
  { title: "Consultation and scan", text: "We listen to what's bothering you, then take a quick 3D scan of your teeth." },
  { title: "Your plan, on screen", text: "We walk you through the options in 3D, with the time and cost of each, and give you a written copy." },
  { title: "Treatment", text: "Gentle, unhurried appointments — we tell you what's happening at every step." },
  { title: "Aftercare", text: "A review visit and simple routines at home to keep the result healthy." },
] as const;

export const ctaContent = {
  title: "Start with a scan.",
  text: "Book a consultation and leave with a 3D record of your teeth and a written plan.",
  primary: "Book a consultation",
};
