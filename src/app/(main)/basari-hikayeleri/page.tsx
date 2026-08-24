import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Quote } from "lucide-react";

import { AboutSection, AboutShell } from "@/components/about/AboutSection";

/**
 * ⚠️ PLACEHOLDER CONTENT — every student, quote and rank below is invented.
 *
 * The portraits are the repo's existing demo images, the same ones the seeded
 * demo tutors use. Nothing here describes a real person or a real result.
 * Replace `STORIES` with consented, real accounts before this page is linked
 * from anywhere public — a fabricated testimonial is the kind of claim that
 * does real damage, and it is invisible once the placeholder scaffolding is
 * gone. The page is `noindex` until then.
 *
 * Layout note: intentionally not the reference site's video-tile masonry — a
 * quote-led editorial row instead, so the resemblance stops at "students say
 * nice things".
 */

export const metadata: Metadata = {
  title: "Hocam'da Başaranlar",
  description: "Hocam'la çalışan öğrencilerin hazırlık süreçleri ve sonuçları.",
  robots: { index: false, follow: true },
};

type Story = {
  id: string;
  name: string;
  photo: string;
  placed: string;
  field: string;
  rankBefore: string;
  rankAfter: string;
  quote: string;
  subjects: string[];
};

const STORIES: Story[] = [
  {
    id: "s1",
    name: "Elif",
    photo: "/images/tutors/demo-woman-2.jpg",
    placed: "Boğaziçi Üniversitesi",
    field: "Psikoloji",
    rankBefore: "48.000",
    rankAfter: "4.120",
    quote:
      "Deneme dersinde hocamla anlaşabileceğimi anladım. Konu anlatımından çok, benim nerede takıldığımı bulmaya çalıştı — asıl fark orada başladı.",
    subjects: ["TYT Matematik", "AYT Matematik"],
  },
  {
    id: "s2",
    name: "Mert",
    photo: "/images/tutors/demo-man-3.jpg",
    placed: "Yıldız Teknik Üniversitesi",
    field: "Makine Mühendisliği",
    rankBefore: "31.500",
    rankAfter: "2.870",
    quote:
      "Üç hocayla ücretsiz tanışma dersi yaptım, üçüncüsünde durdum. Kimseye peşin para vermeden karar verebilmek en rahatlatıcı kısmıydı.",
    subjects: ["AYT Fizik", "AYT Matematik"],
  },
  {
    id: "s3",
    name: "Zeynep",
    photo: "/images/tutors/demo-woman-4.jpg",
    placed: "Hacettepe Üniversitesi",
    field: "Tıp",
    rankBefore: "9.400",
    rankAfter: "980",
    quote:
      "Kendi şehrimde Biyoloji için istediğim hocayı bulamıyordum. Online olması sayesinde haftada üç gün aynı hocayla çalıştım.",
    subjects: ["AYT Biyoloji", "AYT Kimya"],
  },
  {
    id: "s4",
    name: "Kerem",
    photo: "/images/tutors/demo-man-6.jpg",
    placed: "Orta Doğu Teknik Üniversitesi",
    field: "Bilgisayar Mühendisliği",
    rankBefore: "22.000",
    rankAfter: "1.640",
    quote:
      "Profilde hocanın kendi YKS sıralamasını görmek beni ikna etti. Aynı sınavdan geçmiş biriyle çalışmak farklıydı.",
    subjects: ["TYT Matematik", "AYT Matematik"],
  },
] as const;

export default function SuccessStoriesPage() {
  return (
    <article className="pb-10">
      <AboutShell>
        <section className="pt-12 text-center md:pt-16">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
            Başarı hikayeleri
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            Hocam&apos;da Başaranlar
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Doğru hocayla çalışmaya başladıktan sonra ne değişti? Öğrencilerin kendi
            anlatımıyla.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-11 items-center rounded-full bg-brand-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Ücretsiz deneme dersi al
          </Link>
        </section>

        <AboutSection>
          <div className="space-y-6">
            {STORIES.map((story, index) => (
              <article
                key={story.id}
                className={`flex flex-col gap-6 rounded-3xl border bg-card p-6 md:p-8 ${
                  index % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                <div className="shrink-0">
                  <div className="relative size-32 overflow-hidden rounded-2xl md:size-40">
                    <Image
                      src={story.photo}
                      alt=""
                      aria-hidden
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <Quote className="size-6 text-brand-600/40" aria-hidden />
                  <blockquote className="mt-2 text-lg leading-8 md:text-xl md:leading-9">
                    {story.quote}
                  </blockquote>

                  <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{story.name}</span>
                    <span className="text-muted-foreground">
                      · {story.placed} · {story.field}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      YKS sıralaması {story.rankBefore}
                      <span aria-hidden>→</span>
                      {story.rankAfter}
                    </span>
                    {story.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Bu sayfadaki öğrenci hikayeleri tasarım amaçlı örnek içeriktir; gerçek kişileri ve
            sonuçları temsil etmez.
          </p>
        </AboutSection>
      </AboutShell>
    </article>
  );
}
