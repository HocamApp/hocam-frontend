import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  PublicSeoBreadcrumbs,
  PublicSeoChecklist,
  PublicSeoFaq,
  PublicSeoHero,
  PublicSeoInfoCard,
  PublicSeoSection,
} from "@/components/seo/PublicSeoPage";
import {
  breadcrumbJsonLd,
  publicPageMetadata,
  publicWebPageJsonLd,
} from "@/lib/publicSeo";

const path = "/hocalar-nasil-dogrulaniyor" as const;
const title = "Hocalar Nasıl Doğrulanıyor?";
const description =
  "Hocam'da hocaların öğrenci kimliği, YKS sonuç belgesi ve üniversite e-posta adresiyle yaptığı doğrulama başvurusunu öğrenin.";
const breadcrumbs = [
  { label: "YKS özel ders", href: "/yks-ozel-ders" },
  { label: "Hoca doğrulama", href: path },
] as const;

export const metadata = publicPageMetadata({
  title,
  description,
  path,
});

export default function TutorVerificationPage() {
  return (
    <>
      <JsonLd
        data={[
          publicWebPageJsonLd({ path, name: title, description }),
          breadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <article className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PublicSeoBreadcrumbs items={breadcrumbs} />

        <div className="mt-6">
          <PublicSeoHero
            eyebrow="DOĞRULANMIŞ HOCA PROFİLLERİ"
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
          <div className="grid gap-4 md:grid-cols-3">
            <PublicSeoInfoCard title="Başvuru">
              Hoca adayı gerekli bilgileri kendi hesabındaki doğrulama alanından
              gönderir.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="İnceleme">
              Başvuru incelenirken durum hoca hesabında beklemede olarak
              görünür.
            </PublicSeoInfoCard>
            <PublicSeoInfoCard title="Herkese açık profil">
              Öğrenciler yalnızca doğrulanmış ve tamamlanmış hoca profillerini
              dizinde görür.
            </PublicSeoInfoCard>
          </div>
        </PublicSeoSection>

        <PublicSeoSection
          title="Gizlilik sınırı"
          intro="Doğrulama belgeleri profil içeriği değildir. Herkese açık sayfalarda belge görüntüleri, dosya adresleri, özel iletişim bilgileri veya yönetim inceleme notları yayınlanmaz."
          className="border-t"
        >
          <div className="rounded-2xl border bg-muted/30 p-6 text-sm leading-7 text-muted-foreground">
            Herkese açık profil, öğrencinin hoca seçerken kullanacağı ad,
            üniversite, bölüm, YKS sıralaması, ders alanları, bio, ücret ve
            değerlendirme bilgilerini gösterir. Doğrulamada kullanılan özel
            belgeler bu sayfaların dışında tutulur.
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
                      hoca dizininde
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
