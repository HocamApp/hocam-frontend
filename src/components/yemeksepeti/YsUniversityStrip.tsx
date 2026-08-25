"use client";

import { Marquee } from "@/components/ui/marquee";

/**
 * The universities our tutors study at — a flat logo strip sitting where the
 * campaign lane used to, between the app banner and the favourites banner.
 *
 * The whole design problem here is optical size. A university set mixes
 * circular seals with horizontal wordmarks, and neither obvious rule works:
 * give every logo the same height and Koç's wordmark becomes a banner beside
 * the seals; give them the same width and the seals shrink to buttons. Equal
 * *area* over-corrects the other way, leaving wide marks as slivers.
 *
 * So each height is `52 / aspect^0.35` — an area correction, damped. Square
 * marks sit at 52px, İTÜ at 43, Koç at 30 but 141 wide, and the tall seals
 * grow past 52 rather than being capped by it. The numbers are baked in
 * rather than measured at runtime because they depend on the files, and a
 * file swap should force someone to look at the strip again.
 *
 * The source images were trimmed of their transparent margins first —
 * Marmara's was 28% padding, which alone would have made it read a size
 * smaller than everything around it.
 */

type University = {
  name: string;
  logo: string;
  /** Rendered height in px. See the note above before changing one. */
  height: number;
};

const UNIVERSITIES: University[] = [
  { name: "İstanbul Teknik Üniversitesi", logo: "/images/universities/itu.png", height: 43 },
  { name: "Boğaziçi Üniversitesi", logo: "/images/universities/bogazici.png", height: 52 },
  { name: "Orta Doğu Teknik Üniversitesi", logo: "/images/universities/odtu.png", height: 49 },
  { name: "Koç Üniversitesi", logo: "/images/universities/koc.png", height: 30 },
  { name: "Sabancı Üniversitesi", logo: "/images/universities/sabanci.png", height: 39 },
  { name: "Bilkent Üniversitesi", logo: "/images/universities/bilkent.png", height: 52 },
  { name: "Hacettepe Üniversitesi", logo: "/images/universities/hacettepe.png", height: 60 },
  {
    name: "Yıldız Teknik Üniversitesi",
    logo: "/images/universities/yildiz-teknik.png",
    height: 52,
  },
  { name: "İstanbul Üniversitesi", logo: "/images/universities/istanbul.png", height: 52 },
  {
    name: "İstanbul Üniversitesi-Cerrahpaşa",
    logo: "/images/universities/cerrahpasa.png",
    height: 52,
  },
  { name: "Ankara Üniversitesi", logo: "/images/universities/ankara.png", height: 52 },
  { name: "Ege Üniversitesi", logo: "/images/universities/ege.png", height: 52 },
  { name: "Gazi Üniversitesi", logo: "/images/universities/gazi.png", height: 52 },
  { name: "Marmara Üniversitesi", logo: "/images/universities/marmara.png", height: 50 },
  { name: "Dokuz Eylül Üniversitesi", logo: "/images/universities/dokuz-eylul.png", height: 51 },
  {
    name: "İzmir Yüksek Teknoloji Enstitüsü",
    logo: "/images/universities/iyte.png",
    height: 52,
  },
  { name: "Galatasaray Üniversitesi", logo: "/images/universities/galatasaray.png", height: 57 },
];

function UniversityLogo({ name, logo, height }: University) {
  return (
    <div className="flex shrink-0 items-center justify-center" style={{ height: 72 }}>
      {/* Plain <img>: seventeen files, seventeen aspect ratios, and next/image
          wants dimensions per file. They are decorative marks a few KB each. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={name}
        style={{ height }}
        className="w-auto max-w-none object-contain"
        draggable={false}
      />
    </div>
  );
}

export function YsUniversityStrip() {
  return (
    // No rule above it any more: it now sits between two coloured banners,
    // which separate it on their own. A divider there would only add a line.
    <section className="mt-8">
      <p
        className="text-center text-lg font-semibold"
        style={{ color: "var(--ys-neutral-strong)" }}
      >
        Hocalarımızın öğrencisi olduğu üniversiteler.
      </p>

      <div className="relative mt-6">
        {/* Pause rather than slow down. Changing an animation's duration
            mid-run restarts its clock and the row visibly jumps; pausing is
            the one hover response that stays smooth. */}
        <Marquee pauseOnHover className="[--duration:45s] [--gap:2rem] sm:[--gap:4rem]">
          {UNIVERSITIES.map((university) => (
            <UniversityLogo key={university.name} {...university} />
          ))}
        </Marquee>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white sm:w-32" />
      </div>
    </section>
  );
}
