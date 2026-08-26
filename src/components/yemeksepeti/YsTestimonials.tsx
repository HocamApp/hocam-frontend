"use client";

import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/marquee";

/**
 * "Hocalar ve Öğrencilerden" — two marquee rows running in opposite
 * directions, both pausing on hover.
 *
 * The quotes, names and credentials come from the Framer site verbatim. Do not
 * reword them; they are attributed to real people. For the same reason the
 * body is never clamped — half a testimonial misrepresents whoever said it.
 *
 * Colour follows the reference's logic rather than its palette: the section
 * sits on a faint brand tint and the cards are plain white, so they separate
 * by tone alone. Hover fills the card with `--ink` — the reference's yellow,
 * translated through DESIGN.md, where a filled hover is a colour change and
 * never a lift.
 */

type Testimonial = {
  quote: string;
  name: string;
  credential: string;
  photo: string;
};

/**
 * Photos live in `public/images/testimonials/`. `yedek-1.jpeg` came in the same
 * batch but belongs to nobody quoted here — it is spare, deliberately unused.
 */
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Bizim lisede bir abi vardı, herkes ona soru sorardı. Ben de biraz onun gibi olmak istedim; şimdi haftada birkaç saat ders veriyorum, hem para kazanıyorum hem de anlattığım konu daha da pekişiyor bende.",
    name: "Selin",
    credential: "ODTÜ Endüstri Müh., YKS sıralaması 5.400",
    photo: "/images/testimonials/selin.jpeg",
  },
  {
    quote:
      "3 aydır matematik dersi alıyorum, netlerim 18'den 27'ye çıktı. Hocam bana özellikle hangi konuda takıldığımı görüp ona göre gidiyor, okuldaki gibi herkese aynı şey anlatmıyor.",
    name: "Nazli",
    credential: "12. sınıf",
    photo: "/images/testimonials/nazli.jpeg",
  },
  {
    quote:
      "Dershanede hoca konuyu anlatıyor ama sınavda nasıl çıkacağını bilmiyordu resmen. Burdaki abi geçen sene aynı soruları çözmüş, o yüzden nereye dikkat etmem gerektiğini biliyo.",
    name: "Kaan",
    credential: "12. sınıf",
    photo: "/images/testimonials/kaan.jpeg",
  },
  {
    quote:
      "İlk başta güvenmedim açıkçası, herkes hoca diyebiliyo internette. Ama profilde sıralaması falan yazıyordu, gerçekten doğrulanmış olması içimi rahatlattı.",
    name: "Bahadir",
    credential: "12. sınıf",
    photo: "/images/testimonials/bahadir.jpeg",
  },
  {
    quote:
      "Özel ders parası ailemize yük oluyordu direkt. Burda saatlik fiyat neredeyse yarı yarıya, üstüne hoca da yaşça bana yakın olunca daha rahat soru sorabiliyorum.",
    name: "Elif",
    credential: "11. sınıf",
    photo: "/images/testimonials/elif.jpeg",
  },
  {
    quote:
      "Mezun olunca kitapları atacaktım normalde, hepsi çöpe gidecekti. Şimdi hem kendi bilgim işime yarıyor hem de üniversite masraflarımı çıkarıyorum.",
    name: "Zeynep",
    credential: "Boğaziçi Bilgisayar Müh., YKS sıralaması 3.100",
    photo: "/images/testimonials/zeynep.jpeg",
  },
];

const FIRST_ROW = TESTIMONIALS.slice(0, TESTIMONIALS.length / 2);
const SECOND_ROW = TESTIMONIALS.slice(TESTIMONIALS.length / 2);

function ReviewCard({ quote, name, credential, photo }: Testimonial) {
  return (
    <Card className="group/card h-full w-[16.5rem] shrink-0 sm:w-[21rem] cursor-default border-line bg-surface p-5 shadow-none transition-colors duration-[--duration-state] hover:border-ink hover:bg-ink">
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <div className="flex flex-row items-center gap-3">
          <Image
            src={photo}
            alt=""
            width={96}
            height={96}
            className="size-11 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink transition-colors duration-[--duration-state] group-hover/card:text-white">
              {name}
            </p>
            <p className="text-xs text-ink-mid transition-colors duration-[--duration-state] group-hover/card:text-white/75">
              {credential}
            </p>
          </div>
        </div>
        <p className="text-[15px] leading-6 text-ink transition-colors duration-[--duration-state] group-hover/card:text-white">
          {quote}
        </p>
      </CardContent>
    </Card>
  );
}

export function YsTestimonials() {
  return (
    <section className="mt-16 md:mt-24 overflow-hidden rounded-card bg-pink-pale py-16 md:py-24">
      <div className="mx-auto max-w-2xl space-y-2 px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Hocalar ve Öğrencilerden</h2>
        <p className="text-base" style={{ color: "var(--ys-neutral-secondary)" }}>
          Hocam&apos;da ders veren hocalar ve ders alan öğrenciler, kendi deneyimlerini
          anlatıyor.
        </p>
      </div>

      <div className="relative mt-8 flex w-full flex-col items-center justify-center">
        <Marquee pauseOnHover className="[--duration:38s]">
          {FIRST_ROW.map((item) => (
            <ReviewCard key={item.name} {...item} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:38s]">
          {SECOND_ROW.map((item) => (
            <ReviewCard key={item.name} {...item} />
          ))}
        </Marquee>

        {/* Fades to the section tint, not to white — the cards must look like
            they slide under the edge, not into a different surface. Narrow on
            phones, where a proportional fade would cover a third of the row. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-pink-pale sm:w-1/6" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-pink-pale sm:w-1/6" />
      </div>
    </section>
  );
}
