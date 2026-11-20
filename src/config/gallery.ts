/**
 * Smile gallery cases. Photos live in /public/images/gallery as `<name>-<w>.webp` (1x) and
 * `<name>-<2w>.webp` (2x). Every before/after pair is cropped to the same size and processed
 * identically (2x Lanczos resize + mild sharpening) — no colour, tone or local retouching.
 *
 * To add a case: export the two photos at 1x and 2x WebP, then add an entry below.
 * Only publish photos the patient has agreed to share.
 */

import { asset } from "@/lib/asset";

export type GalleryPhoto = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  label: string;
};

export type GalleryCase = {
  id: string;
  title: string;
  summary: string;
  /** Shown under the summary; omit when the title already names the treatment. */
  treatment?: string;
  /** true for before → after pairs: the second photo is revealed with the scan line. */
  isResult: boolean;
  photos: [GalleryPhoto, GalleryPhoto];
};

function photo(name: string, width: number, height: number, label: string, alt: string): GalleryPhoto {
  const base = asset(`/images/gallery/${name}`);
  return {
    src: `${base}-${width}.webp`,
    srcSet: `${base}-${width}.webp ${width}w, ${base}-${width * 2}.webp ${width * 2}w`,
    width,
    height,
    alt,
    label,
  };
}

export const galleryCases: GalleryCase[] = [
  {
    id: "upper-smile",
    title: "A full upper smile, rebuilt",
    summary: "Missing and broken upper front teeth, replaced with a fixed bridge across the front of the mouth.",
    treatment: "Crowns and bridge",
    isResult: true,
    photos: [
      photo("smile-01-before", 580, 354, "Before", "Several upper front teeth missing, the rest broken and decayed."),
      photo("smile-01-after", 580, 354, "After", "A complete row of upper front teeth fixed in place."),
    ],
  },
  {
    id: "front-gap",
    title: "A gap at the front, closed",
    summary: "A missing front tooth and a discoloured neighbour, restored to match the rest of the smile.",
    treatment: "Crowns and bridge",
    isResult: true,
    photos: [
      photo("smile-02-before", 556, 314, "Before", "A gap where an upper front tooth is missing, next to a yellowed tooth."),
      photo("smile-02-after", 556, 314, "After", "The gap filled and both front teeth matching the smile."),
    ],
  },
  {
    id: "dark-tooth",
    title: "A darkened front tooth, made new",
    summary: "A broken, discoloured front tooth and the gap beside it, replaced with natural-looking crowns.",
    treatment: "Crowns and bridge",
    isResult: true,
    photos: [
      photo("smile-03-before", 556, 338, "Before", "A broken, dark upper front tooth beside a gap."),
      photo("smile-03-after", 556, 338, "After", "Two even, natural-coloured upper front teeth."),
    ],
  },
  {
    id: "aligners",
    title: "Clear aligners",
    summary:
      "Clear, removable trays that straighten teeth gradually. They're worn most of the day and taken out to eat and brush.",
    isResult: false,
    photos: [
      photo("aligners-worn", 568, 361, "Worn", "Clear aligners being worn over the upper and lower teeth."),
      photo("aligners-removing", 568, 352, "Taken out", "A patient lifting a clear aligner off the upper teeth."),
    ],
  },
];
