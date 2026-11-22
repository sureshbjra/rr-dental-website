import { writeFileSync } from "node:fs";
import type { NextConfig } from "next";
import { BUILD_ID } from "./src/config/build";

// GitHub Pages: the workflow builds a static export served from /rr-dental-website.
// Locally (npm run dev / build / start) neither variable is set, so nothing changes.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
const staticExport = process.env.STATIC_EXPORT === "true";

// Published builds carry their id in /version.json; open pages compare it with their own and reload
// once when a newer version is live (UPDATE_CHECK in src/app/layout.tsx). Written before Next copies
// /public into the export; local builds have no id and skip it (the file is git-ignored).
if (staticExport && BUILD_ID) writeFileSync("public/version.json", JSON.stringify({ build: BUILD_ID }));

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
