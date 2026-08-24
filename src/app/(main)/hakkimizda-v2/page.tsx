import type { Metadata } from "next";
import Link from "next/link";
import { Compass, GraduationCap, HeartHandshake, ShieldCheck, Sparkles, Target } from "lucide-react";

import { AboutSection, AboutShell } from "@/components/about/AboutSection";

/**
 * A richer take on the About page, kept beside the existing `/hakkimizda`
 * rather than replacing it so the two can be compared before anything on the
 * live site moves.
 *
 * Noindex on purpose: while both pages exist they would compete for the same
 * query. Drop the robots block when this one takes over.
 *
 * The story is the founders' own; the mission, vision and values are written
 * from what the product actually does. There is deliberately no statistics
 * band — the reference page this borrows its shape from leads with "212.000+
 * öğrenci", and Hocam has no such number to show. Inventing one is the single
 * easiest way to make a page like this dishonest.
 */

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Hocam'ı kimler, neden kurdu? Hikayemiz, misyonumuz ve YKS öğrencileri için doğrulanmış hoca pazaryeri kurma nedenimiz.",
  robots: { index: false, follow: true },
};

const TIMELINE = [
  {
    period: "Lise yılları",
    title: "Mersin Eyüp Aygar Fen Lisesi",
    body: "Aynı okulda tanıştık, aynı sınavlara birlikte hazırlandık. O yıllarda gördük ki bir öğrencinin nereye gideceğini çoğu zaman kapasitesi değil, hangi hocaya ulaşabildiği belirliyor.",
  },
  {
    period: "Üniversite",
    title: "Sınavda derece, aklımızda aynı soru",
    body: "Üçümüz de YKS'de derece yaptık. İkimiz Yıldız Teknik Üniversitesi'ne, birimiz Amerika'da Lafayette College'a gitti. Kendi hocalarımızı bulurken ne kadar şansa bağlı ilerlediğimizi ancak o zaman fark ettik.",
  },
  {
    period: "2026",
    title: "Hocam kuruldu",
    body: "Bir öğrencinin, kendi şehrinde bulamadığı hocaya birkaç dakikada ulaşabilmesi için yola çıktık. Doğrulanmış profiller, açık ücretler ve tek bir karşılaştırma ekranı.",
  },
] as const;

const VALUES = [
  {
    Icon: ShieldCheck,
    title: "Doğrulama",
    body: "Dizinde yalnızca öğrenci kimliği, YKS sonuç belgesi ve .edu.tr e-postasıyla doğrulanmış profiller listelenir.",
  },
  {
    Icon: Sparkles,
    title: "Şeffaflık",
    body: "Ücret, ders süresi, değerlendirme ve YKS sıralaması her profilde aynı yerde ve aynı biçimde durur.",
  },
  {
    Icon: HeartHandshake,
    title: "Erişilebilirlik",
    body: "İyi bir hocaya ulaşmak posta koduna bağlı olmamalı. Dersler online, hocalar Türkiye'nin her yerinden.",
  },
  {
    Icon: GraduationCap,
    title: "Öğrenci önceliği",
    body: "Önce ücretsiz tanışma dersi, sonra karar. Kimseyi tanımadığı bir hocaya peşin bağlanmak zorunda bırakmıyoruz.",
  },
] as const;

const REASONS = [
  {
    title: "Karşılaştırılabilir profiller",
    body: "Her hoca aynı alanları doldurur; sen elmayla elmayı karşılaştırırsın.",
  },
  {
    title: "Önce tanış",
    body: "20 dakikalık ilk görüşme ücretsiz. Uymazsa başka bir hocaya bakarsın.",
  },
  {
    title: "Belgeye dayalı güven",
    body: "Sıralama ve üniversite bilgisi beyan değil, incelenmiş belgeyle yayınlanır.",
  },
  {
    title: "Tek ekranda süreç",
    body: "Ders planı, mesajlaşma ve online ders odası aynı hesabın içinde.",
  },
] as const;

export default function AboutV2Page() {
  return (
    <article className="pb-10">
      <AboutShell>
        <section className="pt-12 md:pt-16">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Hakkımızda</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            İyi bir hoca, şansa kalmasın
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Hocam, YKS&apos;ye hazırlanan öğrencilerle doğrulama sürecini tamamlamış hocaları online
            birebir ders için buluşturur. Üçümüz de bu sınavdan geçtik; aradığımız şeyi
            bulamadığımız için kurduk.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tutors"
              className="inline-flex h-11 items-center rounded-full bg-brand-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            >
              Hocaları incele
            </Link>
            <Link
              href="/nasil-calisir"
              className="inline-flex h-11 items-center rounded-full border px-6 text-sm font-semibold transition-colors hover:bg-accent"
            >
              Nasıl çalışır?
            </Link>
          </div>
        </section>

        <AboutSection
          eyebrow="HİKAYEMİZ"
          title="Hocam'ın tohumları nerede atıldı?"
          lede="Üç kurucu, aynı sıralarda başlayan ve aynı soruda birleşen bir yol."
        >
          <ol className="relative space-y-10 border-l pl-8">
            {TIMELINE.map((item) => (
              <li key={item.period} className="relative">
                <span
                  className="absolute -left-[2.3rem] top-1.5 size-3 rounded-full border-2 border-brand-600 bg-background"
                  aria-hidden
                />
                <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
                  {item.period}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ol>
        </AboutSection>

        <AboutSection eyebrow="NEREYE GİDİYORUZ?" title="Misyon & Vizyon" align="center">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-8">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Target className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold">Misyonumuz</h3>
              <p className="mt-3 leading-7 text-muted-foreground">
                Her öğrencinin, kendisine uygun hocayı bulurken tahmin yürütmek zorunda kalmadığı
                bir seçim ortamı kurmak. Bilgi açık, ücret açık, ilk adım ücretsiz.
              </p>
            </div>
            <div className="rounded-2xl border border-transparent bg-brand-700 p-8 text-white">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-white/15">
                <Compass className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold">Vizyonumuz</h3>
              <p className="mt-3 leading-7 text-white/90">
                Bir öğrencinin hangi şehirde büyüdüğünün, hangi okula gittiğinin hazırlık
                sürecini belirlemediği bir düzen. Hocam bu düzeni kurmak için var.
              </p>
            </div>
          </div>
        </AboutSection>

        <AboutSection eyebrow="NEYE İNANIYORUZ?" title="Değerlerimiz" align="center">
          <div className="grid gap-5 sm:grid-cols-2">
            {VALUES.map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl border bg-card p-6">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </AboutSection>

        <AboutSection className="border-t">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Neden varız?</h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                Sınava hazırlık sürecini bizzat yaşadık. Başarı çoğu zaman doğru hocaya ve doğru
                kaynağa ulaşmakla başlıyor — ve bu ulaşma işi hâlâ büyük ölçüde tanıdığa,
                bulunduğun şehre, tesadüfe bağlı.
              </p>
              <p className="mt-4 leading-7 text-muted-foreground">
                Her öğrenci farklıdır: eksik konuları, çalışma hızı, anlaşabildiği anlatım biçimi.
                Herkese aynı hocayı önerip aynı sonucu beklemek mümkün değil. Hocam, seçimi
                öğrencinin kendisine bırakır — ama seçimi bilerek yapabilmesi için gereken her
                bilgiyi önüne koyar.
              </p>
            </div>

            <ul className="divide-y">
              {REASONS.map((reason) => (
                <li key={reason.title} className="py-4 first:pt-0">
                  <h3 className="font-semibold">{reason.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{reason.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </AboutSection>
      </AboutShell>
    </article>
  );
}
