/**
 * Site copy. PLACEHOLDER CONTENT written for layout and motion — confirm every treatment and piece of
 * equipment with the clinic before going live.
 */

export const heroContent = {
  title: ["The future of", "your smile."],
  text: "Precision. Innovation. Confidence. Experience a new dimension of dental care, planned around you.",
  primary: "Book your appointment",
  secondary: "Discover our experience",
  specimen: "Digital smile preview",
};

export const statement =
  "Every plan starts with a 3D scan of your teeth. We show you the options on screen, explain what each one costs, and leave the decision with you.";

export const treatments = [
  {
    title: "Dental implants",
    summary: "A planned replacement for a missing tooth.",
    detail: "An implant plan starts with an assessment and imaging. Your clinician will explain suitable options, timing and aftercare for your situation.",
  },
  {
    title: "Smile makeover",
    summary: "A considered plan for the smile you want.",
    detail: "Explore cosmetic options together and review a digital preview where appropriate. Every plan is tailored after an in-person assessment.",
  },
  {
    title: "Cosmetic dentistry",
    summary: "Whitening, bonding and veneers.",
    detail: "Discuss ways to change the shade, shape or balance of your teeth. Your clinician will explain what can be achieved safely for you.",
  },
  {
    title: "Teeth whitening",
    summary: "A brighter shade with dentist guidance.",
    detail: "A dentist checks your teeth and gums first, then discusses suitable whitening options and what results may be realistic for you.",
  },
  {
    title: "Root canal treatment",
    summary: "Treatment to help keep a tooth.",
    detail: "If the inner tissue of a tooth is inflamed or infected, your dentist can assess whether root canal treatment is an option and explain the steps.",
  },
  {
    title: "Orthodontics",
    summary: "Assessment and planning for tooth alignment.",
    detail: "A clinical assessment helps identify suitable ways to improve tooth alignment, along with the likely stages and review schedule.",
  },
  {
    title: "Clear aligners",
    summary: "Removable trays for selected alignment plans.",
    detail: "A dentist checks whether clear aligners suit your bite and goals, then discusses the proposed sequence, wear routine and follow-up.",
  },
  {
    title: "Dental crowns",
    summary: "A custom restoration for a damaged tooth.",
    detail: "When a tooth needs extra support, your dentist can explain crown materials, preparation and how the restoration is made to fit.",
  },
  {
    title: "Gum care",
    summary: "Personalized care for healthier gums.",
    detail: "Your visit may include a gum assessment, a tailored cleaning plan and practical advice for caring for your gums at home.",
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
  { title: "Healthy Tooth", text: "Start with a clear picture of your smile and the care that keeps it healthy." },
  { title: "Problem Identified", text: "Digital imaging helps your dentist understand what needs attention and explain your options." },
  { title: "Treatment in Progress", text: "Your care follows a considered plan, with your dentist guiding you through each step." },
  { title: "Restored Smile", text: "Finish with a result designed around your comfort, confidence and long-term oral health." },
] as const;

export const ctaContent = {
  title: "Start with a scan.",
  text: "Book a consultation and leave with a 3D record of your teeth and a written plan.",
  primary: "Book a consultation",
};
