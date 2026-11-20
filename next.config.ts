import type { NextConfig } from "next";

// GitHub Pages: the workflow builds a static export served from /rr-dental-website.
// Locally (npm run dev / build / start) neither variable is set, so nothing changes.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
const staticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
  basePath,
  // Partial pre-rendering can't run in a static export, so the Pages build uses classic static
  // rendering (every route here is static anyway); local dev and `next start` keep Cache Components.
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
