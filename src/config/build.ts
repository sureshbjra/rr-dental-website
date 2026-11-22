/**
 * Identifies a deployment: the commit GitHub Actions builds (GITHUB_SHA), read at build time. Empty for
 * local builds, which turns the update check (layout.tsx) off.
 */
export const BUILD_ID = (process.env.GITHUB_SHA ?? "").slice(0, 12);
