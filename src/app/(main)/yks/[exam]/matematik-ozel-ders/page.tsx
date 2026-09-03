import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  PublicSeoBreadcrumbs,
  PublicSeoChecklist,
  PublicSeoFaq,
  PublicSeoHero,
  PublicSeoInfoCard,
  PublicSeoSection,
  PublicSeoStat,
} from "@/components/seo/PublicSeoPage";
import { TutorCard } from "@/components/tutors/TutorCard";
import {
  breadcrumbJsonLd,
  filterTutorsBySubject,
  loadPublicTutors,
  publicPageMetadata,
  publicWebPageJsonLd,
  summarizeTutorPrices,
  tutorItemListJsonLd,
  type PublicSeoRoute,
} from "@/lib/publicSeo";
import { formatPrice } from "@/lib/utils";

type ExamKey = "tyt" | "ayt";

const examPages: Record<
  ExamKey,
  {
    examType: "TYT" | "AYT";
    path: PublicSeoRoute;
    title: string;
    description: string;
    selectionNote: string;
  }
> = {
  tyt: {
    examType: "TYT",
    path: "/yks/tyt/matematik-ozel-ders",
    title: "TYT Matematik Özel Ders",
    description:
      "TYT Matematik dersi veren doğrulanmış hocaları YKS sıralaması, üniversite, değerlendirme ve 40 dakikalık ders ücretiyle karşılaştırın.",
    selectionNote:
      "Profil açıklamasında hocanın çalışma biçimini ve TYT Matematik dersine yaklaşımını okuyun.",
  },
  ayt: {
    examType: "AYT",
    path: "/yks/ayt/matematik-ozel-ders",
    title: "AYT Matematik Özel Ders",
    description:
      "AYT Matematik dersi veren doğrulanmış hocaları YKS sıralaması, üniversite, değerlendirme ve 40 dakikalık ders ücretiyle karşılaştırın.",
    selectionNote:
      "Profil açıklamasında hocanın çalışma biçimini ve AYT Matematik dersine yaklaşımını okuyun.",
  },
};

function getExamPage(exam: string) {
  return examPages[exam.toLocaleLowerCase("tr-TR") as ExamKey];
}

export function generateStaticParams() {
  return [{ exam: "tyt" }, { exam: "ayt" }];
}

export function generateMetadata({
  params,
}: {
  params: { exam: string };
}): Metadata {
  const config = getExamPage(params.exam);
  if (!config) {
    return {
      title: "Matematik Özel Ders",
      robots: { index: false, follow: false },
    };
  }

  return publicPageMetadata({
    title: config.title,
    description: config.description,
    path: config.path,
  });
}

export const revalidate = 3_600;

export default async function MathematicsPrivateLessonPage({
  params,
}: {
  params: { exam: string };
}) {
  const config = getExamPage(params.exam);
  if (!config) notFound();

  const allTutors = await loadPublicTutors();
  const tutors = filterTutorsBySubject(
    allTutors,
    config.examType,
    "Matematik"
  );
  const featuredTutors = tutors.slice(0, 6);
  const priceSummary = summarizeTutorPrices(tutors);
  const directoryHref = `/tutors?exam_type=${config.examType}&subject=Matematik`;
  const breadcrumbs = [
    { label: "YKS özel ders", href: "/yks-ozel-ders" },
    { label: `${config.examType} Matematik özel ders`, href: config.path },
  ] as const;

  return (
    <>
      <JsonLd
        data={[
          publicWebPageJsonLd({
            path: config.path,
            name: config.title,
            description: config.description,
          }),
          breadcrumbJsonLd(breadcrumbs),
          tutorItemListJsonLd({
            tutors: featuredTutors,
            name: `${config.examType} Matematik dersi veren doğrulanmış hocalar`,
            path: config.path,
          }),
        ]}
      />
      <article className="mx-auto w-full max-w-[1248px] px-6 py-16 text-ink md:py-24">
        <PublicSeoBreadcrumbs items={breadcrumbs} />

        <div className="mt-6">
          <PublicSeoHero
            eyebrow={`${config.examType} MATEMATİK İÇİN ONLINE BİREBİR DERS`}
            title={`${config.examType} Matematik hocanı profilleri karşılaştırarak seç`}
            description={config.description}
            primaryAction={{
              label: `${config.examType} Matematik hocalarını gör`,
              href: directoryHref,
            }}
            secondaryAction={{
              label: "Hocalar nasıl doğrulanıyor?",
              href: "/hocalar-nasil-dogrulaniyor",
            }}
          >
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <PublicSeoStat
                value={tutors.length > 0 ? String(tutors.length) : "Güncel"}
                label={
                  tutors.length > 0
                    ? `doğrulanmış ${config.examType} Matematik hocası`
                    : "profiller hoca dizininden yükleniyor"
                }
              />
              <PublicSeoStat
                value={
                  priceSummary
                    ? `${formatPrice(priceSummary.minimum)} ile ${formatPrice(
                        priceSummary.maximum
                      )}`
                    : "Profilde güncel"
                }
                label="listelenen 40 dakikalık ders ücretleri"
              />
              <PublicSeoStat
                value="Online"
                label="birebir ders modeli"
              />
            </div>
          </PublicSeoHero>
        </div>

        <PublicSeoSection
          title={`${config.examType} Matematik hocası seçerken`}
          intro="YKS sıralaması akademik geçmiş hakkında bilgi verir. Ders uyumu için profil açıklaması, ders değerlendirmeleri, uygunluk ve ücret bilgilerini de inceleyin."
        >
          <PublicSeoChecklist
            items={[
              `${config.examType} Matematik dersinin profilin ders alanlarında yer aldığını kontrol edin.`,
              config.selectionNote,
              "Tamamlanan derslerden gelen değerlendirmeleri ve ders sayısını birlikte inceleyin.",
              "Ders saati seçmeden önce profilin güncel uygunluk ve ücret bilgilerine bakın.",
            ]}
          />
        </PublicSeoSection>

        {featuredTutors.length > 0 && (
          <PublicSeoSection
            title={`${config.examType} Matematik dersi veren hocalar`}
            intro={`Bu profiller ${config.examType} Matematik dersini herkese açık ders alanları arasında listeleyen doğrulanmış hocalardan alınır.`}
            className="border-t"
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredTutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
            <div className="mt-7 text-center">
              <Link
                href={directoryHref}
                className="font-medium text-primary hover:underline"
              >
                Tüm {config.examType} Matematik hocalarını karşılaştır
              </Link>
            </div>
          </PublicSeoSection>
        )}

        <PublicSeoSection
          title="Karar vermeden önce bakabileceğin sayfalar"
          className="border-t"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <PublicSeoInfoCard
              title="Ders süreci"
              href="/nasil-calisir"
              linkLabel="Adımları incele"
            >
              Profil incelemeden online ders odasına kadar Hocam&apos;daki
              temel adımları oku.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard
              title="Doğrulama"
              href="/hocalar-nasil-dogrulaniyor"
              linkLabel="Doğrulamayı incele"
            >
              Hocaların herkese açık profile geçmeden önce sunduğu bilgileri
              öğren.
            </PublicSeoInfoCard>
          </div>
        </PublicSeoSection>

        <PublicSeoSection
          title={`${config.examType} Matematik özel ders hakkında sorular`}
          className="border-t"
        >
          <PublicSeoFaq
            items={[
              {
                question: `${config.examType} Matematik hocaları doğrulanmış mı?`,
                answer:
                  "Bu sayfada yalnızca herkese açık ve doğrulanmış hoca profilleri listelenir.",
              },
              {
                question: "YKS sıralaması tek başına seçim için yeterli mi?",
                answer:
                  "YKS sıralaması profil bilgilerinden biridir. Öğretim yaklaşımı, ders değerlendirmeleri, uygunluk ve ücret de öğrenci ile hoca arasındaki uyumu etkiler.",
              },
              {
                question: "Ücretler hangi ders süresi için gösteriliyor?",
                answer:
                  "Profil kartındaki ücret 40 dakikalık standart ders süresi içindir. Daha uzun dersler bu ücret üzerinden orantılı hesaplanır.",
              },
            ]}
          />
        </PublicSeoSection>
      </article>
    </>
  );
}
