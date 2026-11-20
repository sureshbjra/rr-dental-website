import { ScanReveal } from "@/components/gallery/scan-reveal";
import { galleryCases, type GalleryPhoto } from "@/config/gallery";

// Photo column: 8 of 12 columns, two photos side by side from `sm`; full width on phones.
const SIZES = "(min-width: 1536px) 31rem, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw";

function Photo({ photo }: { photo: GalleryPhoto }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-ocean/60 ring-1 ring-mist/10">
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized 1x / 2x WebP with an explicit srcset */}
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={SIZES}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        // lazy (not eager): eager images are preloaded wherever this route is prefetched, i.e. every page
        loading="lazy"
        decoding="async"
        className="block h-auto w-full"
      />
    </div>
  );
}

/** Cases as rows: what was done on the left, the two photos on the right. */
export function SmileGallery() {
  return (
    <ul className="shell">
      {galleryCases.map((c) => (
        <li key={c.id} className="grid gap-8 border-t border-mist/10 py-14 lg:grid-cols-12 lg:gap-6 lg:py-20">
          <div className="lg:col-span-4 lg:pr-6">
            <h2 className="font-display text-display-s">{c.title}</h2>
            <p className="mt-4 max-w-[38ch] text-mist/70">{c.summary}</p>
            {c.treatment && <p className="text-caption mt-4 text-ice/80">Treatment: {c.treatment}</p>}
          </div>

          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:col-span-8">
            {c.photos.map((p, j) => (
              <figure key={p.src}>
                {c.isResult && j === 1 ? (
                  <ScanReveal>
                    <Photo photo={p} />
                  </ScanReveal>
                ) : (
                  <Photo photo={p} />
                )}
                <figcaption className="text-caption mt-3 text-mist/60">{p.label}</figcaption>
              </figure>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
