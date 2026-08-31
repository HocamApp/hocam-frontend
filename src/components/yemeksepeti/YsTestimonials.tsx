"use client";

import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/marquee";

/**
 * "Hocalar ve Öğrencilerden" — one marquee row, pausing on hover.
 *
 * The quotes, names and credentials come from the Framer site verbatim. Do not
 * reword them; they are attributed to real people. For the same reason the
 * body is never clamped — half a testimonial misrepresents whoever said it.
 *
 * Everyone rides the single row: the second row was a split of the same six
 * people, not extra ones, so merging them loses no voice.
 *
 * Colour: the section sits on `--paper`, the page's own surface, and the cards
 * are `--surface` with a hairline, which is DESIGN.md's in-flow separation by
 * value. Hover fills the card with `--gold` and puts `--gold-ink` on it, the
 * reference's yellow kept literally this time, plus the `.ys-sheen` overlay
 * so the fill is satin rather than a paint chip. A filled hover is a colour
 * change and never a lift.
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

function ReviewCard({ quote, name, credential, photo }: Testimonial) {
  return (
    <Card className="group/card relative isolate h-full w-[16.5rem] shrink-0 cursor-default overflow-hidden border-line bg-surface p-5 shadow-none transition-colors duration-[--duration-state] hover:border-gold hover:bg-gold sm:w-[21rem]">
      {/* The sheen, painted under the content and above the fill. Decorative
          and inert: it carries no meaning and takes no pointer events. */}
      <span aria-hidden className="ys-sheen pointer-events-none absolute inset-0 -z-10" />
      <CardContent className="relative flex h-full flex-col gap-3 p-0">
        <div className="flex flex-row items-center gap-3">
          <Image
            src={photo}
            alt=""
            width={96}
            height={96}
            className="size-11 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink transition-colors duration-[--duration-state] group-hover/card:text-gold-ink">
              {name}
            </p>
            <p className="text-xs text-ink-mid transition-colors duration-[--duration-state] group-hover/card:text-[rgb(74_59_0_/_78%)]">
              {credential}
            </p>
          </div>
        </div>
        <p className="text-[15px] leading-6 text-ink transition-colors duration-[--duration-state] group-hover/card:text-gold-ink">
          {quote}
        </p>
      </CardContent>
    </Card>
  );
}

export function YsTestimonials() {
  return (
    <section className="mt-16 overflow-hidden rounded-card bg-paper py-16 md:mt-24 md:py-24">
      <div className="mx-auto max-w-2xl space-y-2 px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink">Hocalar ve Öğrencilerden</h2>
        <p className="text-base text-ink-mid">
          Hocam&apos;da ders veren hocalar ve ders alan öğrenciler, kendi deneyimlerini
          anlatıyor.
        </p>
      </div>

      <div className="ys-marquee-mask relative mt-8 flex w-full flex-col items-center justify-center">
        <Marquee pauseOnHover className="[--duration:38s]">
          {TESTIMONIALS.map((item) => (
            <ReviewCard key={item.name} {...item} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
