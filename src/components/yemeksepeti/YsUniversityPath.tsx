"use client";

import MarqueeAlongSvgPath from "@/components/ui/marquee-along-svg-path";

/**
 * The universities our tutors come from, strung along the reference's own
 * curve — the long ribbon with a loop in the middle, kept verbatim from the
 * 21st.dev demo along with its viewBox, velocity and repeat count. Earlier
 * attempts redrew the path to fit a narrow column and lost what made it work;
 * this one gets a full-width band of its own so the curve can be itself.
 *
 * No visible caption. The band sits between the testimonials and the FAQ and
 * is meant to read as a breath between them, so the label lives on the
 * container for screen readers, which would otherwise get a list of
 * university names and no idea why.
 */

type University = {
  /** Full name, used for assistive tech. */
  name: string;
  /** Shown when a logo file is missing, so a gap never appears. */
  short: string;
  logo?: string;
};

/**
 * Schools a student in roughly the top 15.000 can realistically reach — the
 * band this marketplace is built around. A sample, not a ranking, and it
 * claims nothing about where any individual tutor studied.
 *
 * Logos come from Wikipedia/Wikimedia at 160px wide; the ribbon draws them
 * around 68px, which is already retina-safe.
 */
const UNIVERSITIES: University[] = [
  { name: "Boğaziçi Üniversitesi", short: "Boğaziçi", logo: "/images/universities/bogazici.png" },
  { name: "Orta Doğu Teknik Üniversitesi", short: "ODTÜ", logo: "/images/universities/odtu.png" },
  { name: "İstanbul Teknik Üniversitesi", short: "İTÜ", logo: "/images/universities/itu.png" },
  { name: "Koç Üniversitesi", short: "Koç", logo: "/images/universities/koc.png" },
  { name: "Sabancı Üniversitesi", short: "Sabancı", logo: "/images/universities/sabanci.png" },
  { name: "Bilkent Üniversitesi", short: "Bilkent", logo: "/images/universities/bilkent.png" },
  {
    name: "Hacettepe Üniversitesi",
    short: "Hacettepe",
    logo: "/images/universities/hacettepe.png",
  },
  {
    name: "Yıldız Teknik Üniversitesi",
    short: "Yıldız Teknik",
    logo: "/images/universities/yildiz-teknik.png",
  },
  {
    name: "İstanbul Üniversitesi",
    short: "İstanbul Ü.",
    logo: "/images/universities/istanbul.png",
  },
  {
    name: "İstanbul Üniversitesi-Cerrahpaşa",
    short: "Cerrahpaşa",
    logo: "/images/universities/cerrahpasa.png",
  },
  { name: "Ankara Üniversitesi", short: "Ankara Ü.", logo: "/images/universities/ankara.png" },
  { name: "Ege Üniversitesi", short: "Ege", logo: "/images/universities/ege.png" },
  { name: "Gazi Üniversitesi", short: "Gazi", logo: "/images/universities/gazi.png" },
  { name: "Marmara Üniversitesi", short: "Marmara", logo: "/images/universities/marmara.png" },
  {
    name: "Dokuz Eylül Üniversitesi",
    short: "Dokuz Eylül",
    logo: "/images/universities/dokuz-eylul.png",
  },
  {
    name: "İzmir Yüksek Teknoloji Enstitüsü",
    short: "İYTE",
    logo: "/images/universities/iyte.png",
  },
  {
    name: "Galatasaray Üniversitesi",
    short: "Galatasaray",
    logo: "/images/universities/galatasaray.png",
  },
];

/** The demo's curve, unchanged. */
const PATH =
  "M1 209.434C58.5872 255.935 387.926 325.938 482.583 209.434C600.905 63.8051 525.516 -43.2211 427.332 19.9613C329.149 83.1436 352.902 242.723 515.041 267.302C644.752 286.966 943.56 181.94 995 156.5";

/**
 * On the curve a mark is centred on its point rather than hung from it, so the
 * path runs through the marks instead of along their top-left corners. It is
 * 72px, not the reference's 56 — the reference scales its tiles up more than a
 * page-width band can, so matching its number would read smaller here.
 *
 * `inline` is the phone fallback: normal flow, no centring transform, which in
 * that context would only shift every mark up and left by half its own size.
 */
function UniversityMark({
  name,
  short,
  logo,
  inline = false,
}: University & { inline?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center duration-300 ease-in-out hover:scale-150 ${
        inline ? "size-12" : "size-[72px] -translate-x-1/2 -translate-y-1/2"
      }`}
    >
      {logo ? (
        // Plain <img>: these vary in aspect ratio and next/image wants per-file
        // dimensions for each. `contain`, not the reference's `cover` — cropping
        // a university seal to a square mangles it.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="h-full w-full object-contain" draggable={false} />
      ) : (
        <span className="text-center text-[11px] font-semibold leading-tight text-neutral-700">
          {short}
        </span>
      )}
    </div>
  );
}

export function YsUniversityPath() {
  return (
    <section
      className="mt-12 overflow-hidden"
      role="img"
      aria-label="Hocalarımızın okuduğu üniversitelerden bazıları"
    >
      {/* The ribbon needs width. `responsive` scales the 996-unit viewBox to
          fit, so on a 390px screen every mark lands at 27px — unreadable. The
          marks still belong on a phone, just not on a curve, so below md they
          fall back to a plain wrap. */}
      <div className="flex flex-wrap items-center justify-center gap-6 px-4 py-6 md:hidden">
        {UNIVERSITIES.map((university) => (
          <UniversityMark key={university.name} {...university} inline />
        ))}
      </div>

      <MarqueeAlongSvgPath
        path={PATH}
        viewBox="0 0 996 330"
        baseVelocity={8}
        slowdownOnHover
        draggable
        grabCursor
        dragSensitivity={0.1}
        // One pass, not the reference's two. It carries thirteen images; we
        // carry seventeen universities, and doubling them packed the ribbon
        // until the seals overlapped into noise.
        repeat={1}
        responsive
        // Upright, unlike the reference. Its tiles are abstract type art that
        // reads at any angle; a wordmark like İTÜ or Sabancı would end up
        // upside down on the loop's return.
        rotateAlongPath={false}
        className="hidden h-[420px] w-full scale-105 md:block"
      >
        {UNIVERSITIES.map((university) => (
          <UniversityMark key={university.name} {...university} />
        ))}
      </MarqueeAlongSvgPath>
    </section>
  );
}
