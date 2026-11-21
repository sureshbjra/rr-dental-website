"use client";

import Image from "next/image";
import { useState } from "react";
import type { GalleryPhoto } from "@/config/gallery";

export function BeforeAfterSlider({ before, after, title }: { before: GalleryPhoto; after: GalleryPhoto; title: string }) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative isolate aspect-[1.45] overflow-hidden rounded-[1.5rem] bg-ocean ring-1 ring-mist/10">
      <Image src={after.src} alt={after.alt} fill sizes="(min-width: 1024px) 52vw, 92vw" unoptimized className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image src={before.src} alt={before.alt} fill sizes="(min-width: 1024px) 52vw, 92vw" unoptimized className="object-cover" />
      </div>
      <span className="font-ui text-caption absolute left-4 top-4 rounded-full bg-navy/75 px-3 py-1.5 text-white backdrop-blur">Before</span>
      <span className="font-ui text-caption absolute right-4 top-4 rounded-full bg-navy/75 px-3 py-1.5 text-white backdrop-blur">After</span>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 z-10 flex w-8 -translate-x-1/2 items-center justify-center" style={{ left: `${position}%` }}>
        <span className="absolute inset-y-0 w-px bg-white shadow-[0_0_16px_rgb(0_0_0/0.4)]" />
        <span className="relative flex size-9 items-center justify-center rounded-full border border-white/80 bg-navy/80 text-white shadow-xl">
          <span className="text-[0.7rem] leading-none">↔</span>
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(event) => setPosition(Number(event.currentTarget.value))}
        aria-label={`Compare before and after: ${title}`}
        className="absolute inset-0 z-20 m-0 h-full w-full cursor-ew-resize opacity-0"
      />
      <span className="sr-only" aria-live="polite">Showing {position}% before image</span>
    </div>
  );
}
