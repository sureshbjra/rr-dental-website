/**
 * Files in /public need the base path when the site is served from a sub-path (the GitHub Pages
 * project site lives at /rr-dental-website). Next adds it to routes, scripts and icons by itself,
 * but not to plain string URLs — wrap those in `asset()`.
 *
 * NEXT_PUBLIC_BASE_PATH is set at build time by the Pages workflow; it is empty locally and on a
 * custom domain, so `asset("/x")` is just "/x" there.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${BASE_PATH}${path}`;
