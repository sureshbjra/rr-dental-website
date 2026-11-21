import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteShell } from "@/components/layout/site-shell";
import { siteConfig } from "@/config/site";
import { asset } from "@/lib/asset";

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  // Static file in /public (icon paths inside are relative, so it works under any base path).
  manifest: asset("/manifest.webmanifest"),
  // Icons live in /public and are listed here (not as app/ file conventions): with a base path Next
  // drops the automatic favicon.ico link, and browsers without SVG favicon support still need it.
  icons: {
    icon: [
      { url: asset("/favicon.ico"), sizes: "48x48" },
      { url: asset("/icon.svg"), type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: asset("/apple-icon.png"), sizes: "180x180", type: "image/png" }],
  },
};

/**
 * Archivo's Latin subset through next/font so it is preloaded: the hero headline is set in it, and a
 * late swap re-wraps the headline and pushes the 3D poster down on phones (layout shift, later LCP).
 * The other subsets (latin-ext — e.g. ₹ — and Vietnamese) still load on demand from @fontsource,
 * which is next in the font stack (see --font-sans in globals.css).
 */
const archivo = localFont({
  src: "../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  // A metric-matched Arial can't follow the width axis, so it wouldn't prevent the re-wrap.
  adjustFontFallback: false,
});

export const viewport: Viewport = { themeColor: "#071B35" };

/**
 * Runs before first paint: flags JS so `[data-animate]` elements start hidden (no flash before GSAP
 * takes over), and reveals everything anyway if animations haven't initialised within 4 s.
 */
const ANIMATION_GATE = `(function(){var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!window.__rrAnimReady)d.classList.add('anim-fallback')},4000)})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANIMATION_GATE }} />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="font-ui fixed top-3 left-3 z-[200] -translate-y-24 rounded-full bg-cyan px-5 py-3 text-sm text-navy transition-transform focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
