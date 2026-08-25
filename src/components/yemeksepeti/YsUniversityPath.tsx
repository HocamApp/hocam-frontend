"use client";

import MarqueeAlongSvgPath from "@/components/ui/marquee-along-svg-path";

/**
 * The universities our tutors come from, drifting along a serpentine path.
 *
 * This exists to fill the slack in the FAQ heading column — that column holds
 * one title and one link beside an accordion three times its height, and the
 * gap read as a mistake. It is decoration with a job, not a new section.
 *
 * Desktop only (`hidden md:block` at the call site): on a phone the FAQ column
 * stacks above the questions and there is no slack to fill, so the same block
 * would just push the answers down.
 *
 * Logos come from Wikipedia/Wikimedia at 160px wide — the tiles draw them at
 * ~36px, so that is already retina-safe and keeps the set under 400KB. An
 * entry without a `logo` falls back to its `short` name, which is what keeps
 * a missing or pulled file from leaving a blank tile.
 */

type University = {
  /** Full name, used for assistive tech. */
  name: string;
  /** What the tile shows until a logo file exists. */
  short: string;
  /** Path under `public/`; falls back to the wordmark when absent. */
  logo?: string;
};

/**
 * Scoped to schools a student in roughly the top 15.000 can realistically
 * reach — the band this marketplace is built around. It is a sample, not a
 * ranking, and it claims nothing about where any individual tutor studies.
 *
 * Kept to ten. Twelve crowded the loop badly, and the two that went were the
 * two nobody asked for — one of which had no clean logo source anyway.
 */
const UNIVERSITIES: University[] = [
  { name: "Boğaziçi Üniversitesi", short: "Boğaziçi", logo: "/images/universities/bogazici.png" },
  { name: "Orta Doğu Teknik Üniversitesi", short: "ODTÜ", logo: "/images/universities/odtu.png" },
  { name: "İstanbul Teknik Üniversitesi", short: "İTÜ", logo: "/images/universities/itu.png" },
  { name: "Koç Üniversitesi", short: "Koç", logo: "/images/universities/koc.png" },
  { name: "Sabancı Üniversitesi", short: "Sabancı", logo: "/images/universities/sabanci.png" },
  { name: "Bilkent Üniversitesi", short: "Bilkent", logo: "/images/universities/bilkent.png" },
  { name: "Hacettepe Üniversitesi", short: "Hacettepe", logo: "/images/universities/hacettepe.png" },
  { name: "Yıldız Teknik Üniversitesi", short: "Yıldız Teknik", logo: "/images/universities/yildiz-teknik.png" },
  { name: "İstanbul Üniversitesi", short: "İstanbul Ü.", logo: "/images/universities/istanbul.png" },
  { name: "İstanbul Üniversitesi-Cerrahpaşa", short: "Cerrahpaşa", logo: "/images/universities/cerrahpasa.png" },
];

/**
 * Traced from the route Arda drew over a screenshot: a long climb from the
 * bottom-left, a loop in the middle that crosses back over itself, then a
 * sweep out to the top-right corner.
 *
 * The self-crossing is the whole character of it — a curve that only wiggles
 * reads as a wave, and this has to read as a knot. Segments four and five are
 * what make it cross; keep them if you retune the rest.
 *
 * The viewBox tracks the column's own aspect ratio on purpose. `responsive`
 * scales by the smaller of the two axes, so a box shaped differently from its
 * container gets letterboxed and the curve shrinks into a corner.
 */
const PATH = [
  "M 25 390",
  "C 90 355, 140 322, 175 275", // climb out of the bottom-left
  "C 215 198, 285 118, 368 145", // over the top of the loop
  "C 452 172, 458 268, 358 288", // down its right side, kept wide
  "C 258 308, 212 245, 255 172", // back left and up — crosses the climb here
  "C 305 82, 410 45, 505 32", // away to the top-right
].join(" ");

function UniversityTile({ name, short, logo }: University) {
  return (
    // Centred on its point rather than hung from it, so the curve runs through
    // the middle of each mark instead of along their top-left corners.
    <div className="flex size-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-transform duration-300 ease-in-out hover:scale-125">
      {logo ? (
        // Plain <img>: logo files vary in aspect ratio and next/image wants
        // per-file dimensions for each one. No card, no border — these are
        // finished marks and the chrome only competed with them.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="max-h-full max-w-full object-contain" draggable={false} />
      ) : (
        <span className="text-center text-xs font-semibold leading-tight text-neutral-700">
          {short}
        </span>
      )}
    </div>
  );
}

export function YsUniversityPath({ className }: { className?: string }) {
  return (
    // No visible caption — the column is meant to hold the title and this, and
    // nothing else. The label survives for screen readers, which would
    // otherwise get twelve university names with no idea why.
    <div className={className} role="img" aria-label="Hocalarımızın okuduğu üniversitelerden bazıları">
      <MarqueeAlongSvgPath
        path={PATH}
        viewBox="0 0 520 410"
        baseVelocity={3}
        slowdownOnHover
        draggable
        grabCursor
        dragSensitivity={0.1}
        repeat={1}
        responsive
        rotateAlongPath={false}
        className="mt-6 h-[400px] w-full"
      >
        {UNIVERSITIES.map((university) => (
          <UniversityTile key={university.name} {...university} />
        ))}
      </MarqueeAlongSvgPath>
    </div>
  );
}
