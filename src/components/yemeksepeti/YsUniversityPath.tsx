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
  { name: "Galatasaray Üniversitesi", short: "Galatasaray", logo: "/images/universities/galatasaray.png" },
  { name: "Ankara Üniversitesi", short: "Ankara Ü.", logo: "/images/universities/ankara.png" },
];

/**
 * A serpentine that crosses the column: right, back to the left, out right
 * again. The viewBox is kept close to the column's own aspect ratio on
 * purpose — `responsive` scales by the smaller of the two axes, so a box
 * shaped differently from its container gets letterboxed and the curve
 * collapses into a narrow wiggle.
 */
const PATH =
  "M 30 50 C 190 10, 470 50, 455 140 C 440 230, 130 170, 95 250 C 65 325, 270 350, 490 300";

function UniversityTile({ name, short, logo }: University) {
  return (
    // Centred on its point rather than hung from it, so the curve runs through
    // the middle of each tile instead of along their top-left corners.
    <div className="-translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-in-out hover:scale-125">
      <div className="flex size-14 items-center justify-center rounded-xl border border-brand-100 bg-white p-1.5 shadow-sm">
        {logo ? (
          // Plain <img>: logo files vary in aspect ratio and next/image wants
          // per-file dimensions for each one. They are ~2KB decorative marks.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name} className="max-h-full max-w-full object-contain" draggable={false} />
        ) : (
          <span className="text-center text-[10px] font-semibold leading-tight text-neutral-700">
            {short}
          </span>
        )}
      </div>
    </div>
  );
}

export function YsUniversityPath({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm leading-6 text-muted-foreground">
        Hocalarımızın okuduğu üniversitelerden bazıları
      </p>

      <MarqueeAlongSvgPath
        path={PATH}
        viewBox="0 0 520 360"
        baseVelocity={3}
        slowdownOnHover
        draggable
        grabCursor
        dragSensitivity={0.1}
        repeat={1}
        responsive
        rotateAlongPath={false}
        className="mt-3 h-[330px] w-full"
      >
        {UNIVERSITIES.map((university) => (
          <UniversityTile key={university.name} {...university} />
        ))}
      </MarqueeAlongSvgPath>
    </div>
  );
}
