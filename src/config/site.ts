import type { NavItem } from "@/types";

export const siteConfig = {
  name: "RR Dental",
  tagline: "Future-ready dental care",
  description:
    "RR Dental Hospital — advanced, technology-led dentistry with a premium patient experience.",
  phone: "+91 84899 90103",
  email: "rajeesh@rrdentalhospital.com",
  address: {
    name: "RR Dental Hospital",
    locality: "Ammandivilai",
    region: "Tamil Nadu",
    postalCode: "629204",
  },
};

/** `tel:` link for the clinic phone (spaces removed). */
export const phoneHref = `tel:${siteConfig.phone.replace(/\s+/g, "")}`;

/** The address as display lines: clinic name, then locality, state and PIN code. */
export const addressLines = [
  siteConfig.address.name,
  `${siteConfig.address.locality}, ${siteConfig.address.region} ${siteConfig.address.postalCode}`,
];

/** Google Maps search for the clinic — opens directions on phones. */
export const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLines.join(", "))}`;

export const mainNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Treatments", href: "/treatments" },
  { label: "Doctors", href: "/doctors" },
  { label: "Technology", href: "/technology" },
  { label: "Smile Gallery", href: "/smile-gallery" },
  { label: "Contact", href: "/contact" },
];
