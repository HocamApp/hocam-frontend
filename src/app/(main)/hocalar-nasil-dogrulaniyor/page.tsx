import Link from "next/link";
import { Check, X } from "@phosphor-icons/react/dist/ssr";

import { PublicPageIllustration } from "@/components/shared/PublicPageIllustration";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  PublicSeoChecklist,
  PublicSeoFaq,
  PublicSeoHero,
  PublicSeoRows,
  PublicSeoSection,
} from "@/components/seo/PublicSeoPage";
import { publicPageMetadata, publicWebPageJsonLd } from "@/lib/publicSeo";

const path = "/hocalar-nasil-dogrulaniyor" as const;
const title = "Hocalar Nasıl Doğrulanıyor?";
const description =
  "Hocam'da hocaların öğrenci kimliği, YKS sonuç belgesi ve üniversite e-posta adresiyle yaptığı doğrulama başvurusunu öğrenin.";
export const metadata = publicPageMetadata({
  title,
  description,
  path,
});

function DisclosureList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "shown" | "hidden";
  items: ReadonlyArray<string>;
}) {
  const Icon = tone === "shown" ? Check : X;

  return (
    <div className="rounded-card border border-line bg-[var(--surface)] p-6">
      <h3 className="text-[19px] font-medium leading-[1.3] text-ink">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-base leading-[1.6] text-ink-mid"
          >
            <Icon
              className="mt-[3px] h-4 w-4 shrink-0 text-ink"
              weight="regular"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TutorVerificationPage() {
  return (
    <>
      <JsonLd
        data={[publicWebPageJsonLd({ path, name: title, description })]}
      />
      <article className="mx-auto w-full max-w-[1248px] px-6 py-16 text-ink md:py-24">
        <div>
          <PublicSeoHero
            illustration={<PublicPageIllustration kind="review" priority />}
            title="Herkese açık profilden önce belge incelemesi"
            description="Hoca adayları öğrenci kimliği, YKS sonuç belgesi ve .edu.tr uzantılı üniversite e-posta adresiyle doğrulama başvurusu yapar. Onay durumu herkese açık profilde doğrulama rozetiyle gösterilir."
            primaryAction={{ label: "Doğrulanmış hocaları gör", href: "/tutors" }}
            secondaryAction={{
              label: "Ders sürecini incele",
              href: "/nasil-calisir",
            }}
          />
        </div>

        <PublicSeoSection
          title="Başvuruda kullanılan bilgiler"
          intro="Başvurunun amacı, herkese açık profilde gösterilen akademik bilgilerin dayanağını incelemektir."
        >
          <PublicSeoChecklist
            items={[
              "Öğrenci kimlik kartının fotoğrafı veya taraması",
              "YKS sonuç belgesinin ekran görüntüsü veya PDF dosyası",
              ".edu.tr uzantılı üniversite e-posta adresi",
              "Profilde yayınlanacak üniversite, bölüm ve YKS sıralaması bilgileri",
            ]}
          />
        </PublicSeoSection>

        <PublicSeoSection
          title="Doğrulama durumu profilde nasıl görünür?"
          className="border-t"
        >
          <PublicSeoRows
            ordered
            items={[
              {
                title: "Başvuru",
                body: "Hoca adayı gerekli bilgileri kendi hesabındaki doğrulama alanından gönderir.",
              },
              {
                title: "İnceleme",
                body: "Başvuru incelenirken durum hoca hesabında beklemede olarak görünür.",
              },
              {
                title: "Herkese açık profil",
                body: "Öğrenciler yalnızca doğrulanmış ve tamamlanmış hoca profillerini hoca listesinde görür.",
              },
            ]}
          />
        </PublicSeoSection>

        <PublicSeoSection
          title="Profilde ne görünür, ne görünmez?"
          intro="Doğrulama için gönderilen belgeler profil içeriği değildir. Herkese açık sayfada yalnızca hoca seçerken işine yarayan bilgiler yer alır."
          className="border-t"
        >
          {/* The old version stated the same rule twice, once as an intro and
              once inside a tinted box, without ever naming what falls on
              either side of the line. Two columns answer the question the
              heading asks. */}
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <DisclosureList
              title="Profilde görünür"
              tone="shown"
              items={[
                "Ad",
                "Üniversite ve bölüm",
                "YKS sıralaması",
                "Ders alanları",
                "Hocanın kendi yazdığı tanıtım",
                "Ders ücreti",
                "Tamamlanan derslerden gelen değerlendirmeler",
              ]}
            />
            <DisclosureList
              title="Profilde görünmez"
              tone="hidden"
              items={[
                "Öğrenci kimliği ve YKS sonuç belgesi",
                "Yüklenen dosyaların adresleri",
                "Üniversite e-posta adresi",
                "Özel iletişim bilgileri",
                "Yönetim inceleme notları",
              ]}
            />
          </div>
        </PublicSeoSection>

        <PublicSeoSection
          title="Doğrulama hakkında sık sorulanlar"
          className="border-t"
        >
          <PublicSeoFaq
            items={[
              {
                question: "YKS sıralaması profilde gösteriliyor mu?",
                answer:
                  "Evet. Onaylanan hocaların YKS sıralaması, üniversite ve bölüm bilgileri herkese açık profilde yer alır.",
              },
              {
                question: "Doğrulama belgelerini öğrenciler görebilir mi?",
                answer:
                  "Hayır. Belge dosyaları ve inceleme ayrıntıları herkese açık profil içeriğine eklenmez.",
              },
              {
                question: "Doğrulama iyi bir ders deneyimini garanti eder mi?",
                answer:
                  "Doğrulama, profilin akademik bilgilerinin incelendiğini gösterir. Öğrenci; bio, ders alanı, değerlendirme, uygunluk ve ücret bilgilerini de karşılaştırmalıdır.",
              },
              {
                question: "Doğrulanmış profilleri nerede görebilirim?",
                answer: (
                  <>
                    Güncel profiller{" "}
                    <Link
                      href="/tutors"
                      className="text-primary hover:underline"
                    >
                      hoca listesinde
                    </Link>{" "}
                    listelenir.
                  </>
                ),
              },
            ]}
          />
        </PublicSeoSection>
      </article>
    </>
  );
}
