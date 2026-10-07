"use client";

import { CaretDown } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { cn } from "@/lib/utils";

import { FAQ_SECTION_ID } from "./ysAppNav";
import { YsFact } from "./YsFact";
import { faq as copy, type FaqFacts, type FaqPart } from "./ysHomeCopy";
import {
  SupportAccordionSection,
  type SupportAccordionSectionItem,
} from "@/components/support/SupportAccordionSection";

import {
  CANCELLATION_FREE_HOURS,
  isTodo,
  LESSON_MINUTES,
  LESSONS_PER_WEEK,
  MAX_PACKAGE_DISCOUNT_PERCENT,
  MONTHLY_TRIAL_LIMIT,
  OFF_PLATFORM_TEXT,
  PACKAGE_GRACE_DAYS,
  PARENT_CAN_JOIN_TEXT,
  PARENT_CAN_PAY_TEXT,
  PLAN_DURATIONS,
  STUDENT_NO_SHOW_TEXT,
  TAX_TEXT,
  TRIAL_MINUTES,
  TRIAL_PAID_TO_TUTOR,
  TUTOR_MIN_WEEKLY_HOURS,
  TUTOR_MUST_ACCEPT_TEXT,
  TUTOR_NO_SHOW_TEXT,
} from "./ysHomeFacts";

/**
 * The homepage FAQ.
 *
 * Reuses `SupportAccordionSection` — the same split layout and the same 200ms
 * Radix accordion `/support` uses — and only supplies its own content. The
 * support page's own `SupportFAQ` is deliberately not reused: its questions are
 * about the support desk, and it anchors to a form that does not exist here.
 *
 * Every number below comes from `ysHomeFacts.ts`, which mirrors the backend
 * constants. Three subjects are left out on purpose because the code cannot
 * back them up: payment methods and refunds (no provider is connected — the
 * checkout says "Bu adımda kartından ücret alınmaz"), coaching (behind two
 * flags that both default to off), and any turnaround time (no SLA exists).
 */

const faqLinkClass = "font-medium text-pink underline-offset-2 hover:underline";

const YS_HOME_FAQ_ITEMS: SupportAccordionSectionItem[] = [
  {
    id: "ys-faq-deneme",
    title: "Ücretsiz deneme dersi nasıl çalışıyor?",
    content: (
      <p className="text-base leading-7">
        Deneme dersi {TRIAL_MINUTES} dakika sürer ve ücretsizdir; ödeme ya da paket hakkı
        gerekmez. Her hocayla bir kez deneme dersi yapabilirsin ve aynı takvim ayı içinde en
        fazla {MONTHLY_TRIAL_LIMIT} deneme dersi hakkın olur. Bu seçeneği yalnızca profilinde
        deneme dersini açık tutan hocalarda görürsün.
      </p>
    ),
  },
  {
    id: "ys-faq-sure-ucret",
    title: `Standart bir ders kaç dakika, ücreti nasıl belirleniyor?`,
    content: (
      <p className="text-base leading-7">
        Standart ders {LESSON_MINUTES} dakikadır. Hoca profilinde gördüğün ücret bu{" "}
        {LESSON_MINUTES} dakikalık dersin ücretidir; ücreti her hoca kendisi belirler ve
        dilediğinde güncelleyebilir. Bu yüzden ders seçmeden önce ilgili profildeki güncel
        değere bak.
      </p>
    ),
  },
  {
    id: "ys-faq-tek-ders",
    title: "Tek ders satın alabilir miyim?",
    content: (
      <p className="text-base leading-7">
        Hayır. Ücretsiz deneme dersi dışındaki dersler paket üzerinden alınır. Paketi kurarken
        haftada 2–6 ders arasından seçim yapar, süreyi 2 hafta, 1 ay, 3 ay veya 6 ay olarak
        belirlersin. Paket seçtiğin hocaya özeldir ve otomatik yenilenmez. Süre dolduktan sonra
        kalan derslerini kullanman için {PACKAGE_GRACE_DAYS} günlük ek süren olur.
      </p>
    ),
  },
  {
    id: "ys-faq-paket-fiyat",
    title: "Paket seçerken ders başına fiyat nasıl değişiyor?",
    content: (
      <p className="text-base leading-7">
        Haftalık ders sayısı arttıkça ve paket süresi uzadıkça ders başına ücret düşer. En yoğun
        ve en uzun seçimde bu fiyat avantajı %{MAX_PACKAGE_DISCOUNT_PERCENT}&apos;a kadar
        çıkabilir. Seçimini yaptığında toplam ders sayısı, liste fiyatı ve uygulanan fiyat
        avantajı özet ekranında ayrı ayrı gösterilir.
      </p>
    ),
  },
  {
    id: "ys-faq-iptal",
    title: "Bir dersi iptal edersem ne oluyor?",
    content: (
      <p className="text-base leading-7">
        Dersin başlamasına {CANCELLATION_FREE_HOURS} saatten fazla varken iptal edersen
        kullandığın ders hakkı paketine geri döner. {CANCELLATION_FREE_HOURS} saatten az
        kaldığında yapılan iptalde ders hakkı geri verilmez. Planın değişecekse hocanı mümkün
        olduğunca erken haberdar et.
      </p>
    ),
  },
  {
    id: "ys-faq-ders-odasi",
    title: "Dersler nerede yapılıyor, kaydediliyor mu?",
    content: (
      <p className="text-base leading-7">
        Dersler Hocam&apos;ın kendi online ders odasında yapılır; ders saatinde hesabındaki
        rezervasyon üzerinden katılırsın. Ders odasında kayıt, canlı yayın ve otomatik konuşma
        dökümü kapalıdır — dersler kaydedilmez.
      </p>
    ),
  },
  {
    id: "ys-faq-dogrulama",
    title: "Hocalar nasıl doğrulanıyor?",
    content: (
      <p className="text-base leading-7">
        Hoca adayları öğrenci kimliği, YKS sonuç belgesi ve .edu.tr uzantılı üniversite e-posta
        adresiyle başvurur. Hoca listesinde yalnızca doğrulanmış ve yayına açık profiller listelenir.
        Doğrulamada kullanılan belgeler herkese açık profilde yayınlanmaz. Ayrıntıları{" "}
        <Link href="/hocalar-nasil-dogrulaniyor" className={faqLinkClass}>
          doğrulama sayfasında
        </Link>{" "}
        okuyabilirsin.
      </p>
    ),
  },
  {
    id: "ys-faq-mesaj",
    title: "Ders almadan hocayla iletişim kurabilir miyim?",
    content: (
      <p className="text-base leading-7">
        Evet. Hoca profilindeki mesaj alanından ilk mesajını gönderdiğinde konuşma hemen başlar,
        ayrıca bir onay adımı yoktur. Ders talebi oluşturduğunda da aynı konuşma açılır. Mesaj
        gönderebilmek için hesabınla giriş yapmış olman gerekir.
      </p>
    ),
  },
];

export { YS_HOME_FAQ_ITEMS };

export type FaqAudience = "student" | "parent" | "tutor";

const FAQ_FACTS: FaqFacts = {
  trialMinutes: TRIAL_MINUTES,
  trialLimit: MONTHLY_TRIAL_LIMIT,
  lessonMinutes: LESSON_MINUTES,
  weeklyMin: LESSONS_PER_WEEK.min,
  weeklyMax: LESSONS_PER_WEEK.max,
  shortestPlan: PLAN_DURATIONS[0].label.toLocaleLowerCase("tr-TR"),
  longestPlan: PLAN_DURATIONS[PLAN_DURATIONS.length - 1].label.toLocaleLowerCase("tr-TR"),
  maxDiscount: MAX_PACKAGE_DISCOUNT_PERCENT,
  cancelHours: CANCELLATION_FREE_HOURS,
  offPlatform: OFF_PLATFORM_TEXT,
  parentCanPay: PARENT_CAN_PAY_TEXT,
  parentCanJoin: PARENT_CAN_JOIN_TEXT,
  tutorNoShow: TUTOR_NO_SHOW_TEXT,
  trialPaid: TRIAL_PAID_TO_TUTOR,
  mustAccept: TUTOR_MUST_ACCEPT_TEXT,
  minWeeklyHours: TUTOR_MIN_WEEKLY_HOURS,
  studentNoShow: STUDENT_NO_SHOW_TEXT,
  tax: TAX_TEXT,
};

export interface FaqEntry {
  id: string;
  question: string;
  answer: FaqPart[];
  /** Some part of the answer is still a TODO fact. */
  pending: boolean;
}

function isFactPart(part: FaqPart): part is { fact: unknown; label: string } {
  return typeof part === "object" && "fact" in part;
}

/**
 * The questions for one audience. Outside development an answer that still
 * quotes a TODO fact is left out entirely, rather than shown with a hole.
 */
export function faqEntries(audience: FaqAudience, production = process.env.NODE_ENV === "production"): FaqEntry[] {
  return copy[audience](FAQ_FACTS)
    .map((item) => ({
      ...item,
      answer: [...item.answer],
      pending: item.answer.some((part) => isFactPart(part) && isTodo(part.fact)),
    }))
    .filter((item) => !production || !item.pending);
}

/** The answer as plain text, for the FAQPage JSON-LD. */
export function faqAnswerText(answer: readonly FaqPart[]): string {
  return answer
    .map((part) =>
      typeof part === "string" ? part : isFactPart(part) ? String(part.fact) : part.text,
    )
    .join("");
}

function FaqAnswer({ answer }: { answer: readonly FaqPart[] }) {
  return (
    <>
      {answer.map((part, index) =>
        typeof part === "string" ? (
          part
        ) : isFactPart(part) ? (
          <YsFact key={index} value={part.fact} label={part.label} />
        ) : (
          <Link key={index} href={part.href} className={faqLinkClass}>
            {part.text}
          </Link>
        ),
      )}
    </>
  );
}

/**
 * The rebuilt FAQ (NEXT_PUBLIC_HOME_V2): Öğrenci / Veli / Hoca tabs.
 *
 * Native `<details>` rather than the Radix accordion, because Radix unmounts
 * closed answers: here every answer is in the server HTML, and the questions
 * open without JavaScript. All three panels render; the tabs only toggle
 * `hidden`, so with JavaScript off the first tab is readable. The open
 * animation is the accordion's 200ms, in yemeksepeti.css.
 *
 * `audiences` narrows it to one tab for /veliler and /hoca-ol.
 */
function YsHomeFaqTabs({
  audiences = ["student", "parent", "tutor"],
  guideHref = "#ogrenciler",
}: {
  audiences?: FaqAudience[];
  guideHref?: string;
}) {
  const panels = audiences
    .map((audience) => ({ audience, entries: faqEntries(audience) }))
    .filter((panel) => panel.entries.length > 0);
  const [active, setActive] = useState<FaqAudience | undefined>(panels[0]?.audience);
  if (panels.length === 0) return null;

  const visible = panels.flatMap((panel) => panel.entries).filter((entry) => !entry.pending);

  return (
    <div
      id={FAQ_SECTION_ID}
      className="mt-[120px] grid scroll-mt-[calc(var(--app-header-h)+24px)] grid-cols-1 gap-x-16 gap-y-8 border-t border-line pb-[88px] pt-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      {visible.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: visible.map((entry) => ({
              "@type": "Question",
              name: entry.question,
              acceptedAnswer: { "@type": "Answer", text: faqAnswerText(entry.answer) },
            })),
          }}
        />
      )}

      <div className="min-w-0">
        <h2 className="text-2xl font-bold leading-8 tracking-[-0.6px]">{copy.title}</h2>
        {panels.length > 1 && (
          <div role="tablist" aria-label={copy.tabsLabel} className="mt-6 flex flex-wrap gap-2">
            {panels.map(({ audience }) => {
              const selected = audience === active;
              return (
                <button
                  key={audience}
                  type="button"
                  role="tab"
                  id={`ys-faq-tab-${audience}`}
                  aria-selected={selected}
                  aria-controls={`ys-faq-panel-${audience}`}
                  onClick={() => setActive(audience)}
                  className={cn(
                    "inline-flex h-9 items-center rounded-pill border border-ink px-[22px] text-[0.875rem] font-medium transition-colors duration-[--duration-state]",
                    selected ? "bg-ink text-paper" : "text-ink hover:bg-ink hover:text-paper",
                  )}
                >
                  {copy.tabs[audience]}
                </button>
              );
            })}
          </div>
        )}
        <Link href={guideHref} className={`mt-6 inline-flex ${faqLinkClass}`}>
          {copy.guideLink}
        </Link>
      </div>

      <div className="min-w-0">
        {panels.map(({ audience, entries }) => (
          <div
            key={audience}
            role={panels.length > 1 ? "tabpanel" : undefined}
            id={`ys-faq-panel-${audience}`}
            aria-labelledby={panels.length > 1 ? `ys-faq-tab-${audience}` : undefined}
            hidden={audience !== active}
          >
            {entries.map((entry, index) => (
              <details
                key={entry.id}
                open={index === 0}
                className="ys-faq-details group border-t border-line last:border-b"
              >
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-base font-medium leading-6 text-ink [&::-webkit-details-marker]:hidden">
                  {entry.question}
                  <CaretDown
                    className="size-4 flex-none text-ink-mid transition-transform duration-[--duration-state] group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="ys-faq-answer pb-5 pr-8 text-[15px] leading-[25px] text-ink-mid">
                  <FaqAnswer answer={entry.answer} />
                </p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function YsHomeFaq({
  v2 = false,
  audiences,
  guideHref,
}: {
  v2?: boolean;
  audiences?: FaqAudience[];
  guideHref?: string;
} = {}) {
  if (v2) return <YsHomeFaqTabs audiences={audiences} guideHref={guideHref} />;
  return (
    <div id={FAQ_SECTION_ID} className="scroll-mt-[calc(var(--app-header-h)+24px)] [&>section]:mt-16 [&>section]:py-0 md:[&>section]:mt-24">
      <SupportAccordionSection
        layout="split"
        items={YS_HOME_FAQ_ITEMS}
        heading={
          /* Title and the guide link, nothing more. The eyebrow and standfirst
             both restated the title. The column runs short beside the
             accordion, which is what the link is doing down there. */
          <div>
            <h2 className="text-2xl font-bold leading-[1.333] tracking-tight">
              Merak Edilenler
            </h2>
            <Link href="/nasil-calisir" className={`mt-4 inline-flex ${faqLinkClass}`}>
              Ders sürecinin tamamını oku
            </Link>
          </div>
        }
      />
    </div>
  );
}
