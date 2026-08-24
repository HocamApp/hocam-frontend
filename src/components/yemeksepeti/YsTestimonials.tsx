"use client";

import { useRef } from "react";
import Image from "next/image";
import type { Variants } from "framer-motion";

import { TimelineContent } from "@/components/ui/timeline-animation";

/**
 * "Hocalar ve Öğrencilerden" — the testimonial wall, ported from the Framer
 * site so the quotes, names and credentials stay exactly as they were written
 * there. Do not reword them; they are attributed to real people.
 *
 * Layout follows the 21st.dev bento reference, with two changes the reference
 * did not have: the grid-line texture behind the light cards is gone, and the
 * blue/black palette is replaced by Hocam's — brand pink for the accent cards,
 * `--ys-neutral-strong` for the dark ones, `brand-50` for the light ones. Only
 * `--brand-*` and literal neutrals are used, so this survives a portal or a
 * theme swap the same way the entry dialog does.
 */

/**
 * Portraits. **Placeholders** — these are the repo's stock demo photos, not the
 * people quoted below. Drop the real files into `public/images/testimonials/`
 * and repoint this map; it is the only place a photo path appears.
 */
const PHOTOS = {
  bahadir: "/images/tutors/demo-man-1.jpg",
  zeynep: "/images/tutors/demo-woman-1.jpg",
  selin: "/images/tutors/demo-woman-3.jpg",
  nazli: "/images/tutors/demo-woman-2.jpg",
  kaan: "/images/tutors/demo-man-2.jpg",
  elif: "/images/tutors/demo-woman-4.jpg",
} as const;

type Testimonial = {
  quote: string;
  name: string;
  credential: string;
  photo: string;
};

const SELIN: Testimonial = {
  quote:
    "Bizim lisede bir abi vardı, herkes ona soru sorardı. Ben de biraz onun gibi olmak istedim; şimdi haftada birkaç saat ders veriyorum, hem para kazanıyorum hem de anlattığım konu daha da pekişiyor bende.",
  name: "Selin",
  credential: "ODTÜ Endüstri Müh., YKS sıralaması 5.400",
  photo: PHOTOS.selin,
};

const ELIF: Testimonial = {
  quote:
    "Özel ders parası ailemize yük oluyordu direkt. Burda saatlik fiyat neredeyse yarı yarıya, üstüne hoca da yaşça bana yakın olunca daha rahat soru sorabiliyorum.",
  name: "Elif",
  credential: "11. sınıf",
  photo: PHOTOS.elif,
};

const NAZLI: Testimonial = {
  quote:
    "3 aydır matematik dersi alıyorum, netlerim 18'den 27'ye çıktı. Hocam bana özellikle hangi konuda takıldığımı görüp ona göre gidiyor, okuldaki gibi herkese aynı şey anlatmıyor.",
  name: "Nazli",
  credential: "12. sınıf",
  photo: PHOTOS.nazli,
};

const KAAN: Testimonial = {
  quote:
    "Dershanede hoca konuyu anlatıyor ama sınavda nasıl çıkacağını bilmiyordu resmen. Burdaki abi geçen sene aynı soruları çözmüş, o yüzden nereye dikkat etmem gerektiğini biliyo.",
  name: "Kaan",
  credential: "12. sınıf",
  photo: PHOTOS.kaan,
};

const BAHADIR: Testimonial = {
  quote:
    "İlk başta güvenmedim açıkçası, herkes hoca diyebiliyo internette. Ama profilde sıralaması falan yazıyordu, gerçekten doğrulanmış olması içimi rahatlattı.",
  name: "Bahadir",
  credential: "12. sınıf",
  photo: PHOTOS.bahadir,
};

const ZEYNEP: Testimonial = {
  quote:
    "Mezun olunca kitapları atacaktım normalde, hepsi çöpe gidecekti. Şimdi hem kendi bilgim işime yarıyor hem de üniversite masraflarımı çıkarıyorum.",
  name: "Zeynep",
  credential: "Boğaziçi Bilgisayar Müh., YKS sıralaması 3.100",
  photo: PHOTOS.zeynep,
};

const REVEAL: Variants = {
  hidden: { opacity: 0, y: -20, filter: "blur(10px)" },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: index * 0.12, duration: 0.5 },
  }),
};

/** Shared body of every card, so only the surface colours differ per tone. */
function Quote({
  testimonial,
  tone,
}: {
  testimonial: Testimonial;
  tone: "light" | "dark" | "brand";
}) {
  const credentialClass = tone === "light" ? "text-neutral-500" : "text-white/75";

  return (
    <article className="mt-auto">
      <p className="text-[15px] leading-6">{testimonial.quote}</p>
      <div className="flex items-end justify-between gap-4 pt-5">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">{testimonial.name}</h3>
          <p className={`text-sm ${credentialClass}`}>{testimonial.credential}</p>
        </div>
        <Image
          src={testimonial.photo}
          alt=""
          width={200}
          height={200}
          className="size-14 shrink-0 rounded-xl object-cover"
        />
      </div>
    </article>
  );
}

const TONE_CLASS = {
  light: "bg-brand-50 border-brand-100 text-neutral-900",
  dark: "bg-[#1a1a1a] border-[#1a1a1a] text-white",
  brand: "bg-brand-700 border-brand-700 text-white",
} as const;

export function YsTestimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const card = (
    testimonial: Testimonial,
    tone: keyof typeof TONE_CLASS,
    animationNum: number,
    sizing: string,
  ) => (
    <TimelineContent
      animationNum={animationNum}
      customVariants={REVEAL}
      timelineRef={sectionRef}
      className={`flex flex-col justify-between rounded-lg border p-5 ${TONE_CLASS[tone]} ${sizing}`}
    >
      <Quote testimonial={testimonial} tone={tone} />
    </TimelineContent>
  );

  return (
    <section ref={sectionRef} className="mt-14">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <TimelineContent
          as="h2"
          animationNum={0}
          customVariants={REVEAL}
          timelineRef={sectionRef}
          className="text-3xl font-bold tracking-tight"
        >
          Hocalar ve Öğrencilerden
        </TimelineContent>
        <TimelineContent
          as="p"
          animationNum={1}
          customVariants={REVEAL}
          timelineRef={sectionRef}
          className="text-base"
        >
          <span style={{ color: "var(--ys-neutral-secondary)" }}>
            Hocam&apos;da ders veren hocalar ve ders alan öğrenciler, kendi deneyimlerini
            anlatıyor.
          </span>
        </TimelineContent>
      </div>

      {/* Three columns on desktop; each becomes a two-card row on tablet and
          unwraps into a single stack on mobile. The 7/3 grow ratios only split
          whatever slack the tallest column leaves over, so in practice the
          rows land close to even — the reference's dramatic size contrast
          needed fixed heights, which would clip these quotes. */}
      <div className="mt-8 flex flex-col gap-3 lg:grid lg:grid-cols-3">
        <div className="flex flex-col gap-3 md:flex-row lg:flex-col">
          {card(SELIN, "light", 0, "lg:flex-[7_0_auto]")}
          {card(ELIF, "brand", 1, "lg:flex-[3_0_auto]")}
        </div>

        <div className="flex flex-col gap-3 md:flex-row lg:flex-col">
          {card(NAZLI, "dark", 2, "lg:flex-[1_0_auto]")}
          {card(KAAN, "dark", 3, "lg:flex-[1_0_auto]")}
        </div>

        <div className="flex flex-col gap-3 md:flex-row lg:flex-col">
          {card(BAHADIR, "brand", 4, "lg:flex-[3_0_auto]")}
          {card(ZEYNEP, "light", 5, "lg:flex-[7_0_auto]")}
        </div>
      </div>
    </section>
  );
}
