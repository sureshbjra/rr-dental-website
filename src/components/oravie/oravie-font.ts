import localFont from "next/font/local";

/** Plus Jakarta Sans (SIL OFL 1.1, see src/fonts/plus-jakarta-sans-OFL.txt) — the reference's geometric sans. */
export const oravieFont = localFont({
  src: "../../fonts/plus-jakarta-sans-latin-wght.woff2",
  variable: "--font-oravie",
  weight: "200 800",
  display: "swap",
});
