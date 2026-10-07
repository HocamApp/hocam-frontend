import Image from "next/image";
import type { CSSProperties } from "react";

import {
  VerticalTabs,
  type VerticalTabItem,
} from "@/components/ui/vertical-tabs";

import { YsFact } from "./YsFact";
import { YsJourneyHeading } from "./YsJourneyHeading";
import { YS_SECTION_HEADING_CLASSNAME } from "./YsPillHeading";
import { YsStepList, type YsStep } from "./YsStepList";
import { JOURNEY_SECTION_ID } from "./ysAppNav";
import { students as copy } from "./ysHomeCopy";
import {
  LESSONS_PER_WEEK,
  MONTHLY_TRIAL_LIMIT,
  PAYMENT_CHARGED_WHEN,
  PLAN_DURATIONS,
  REMAINING_ON_SWITCH_TEXT,
  TRIAL_MINUTES,
} from "./ysHomeFacts";

const JOURNEY_STEPS: VerticalTabItem[] = [
  {
    id: "01",
    title: "Hocanı bul",
    description:
      "İstediğin dersi veya üniversiteyi filtrele, hocaları karşılaştır, sana uygun olanı seç.",
    imageSrc: "/images/how-it-works/01-tutor-list.png",
    imageAlt: "Hoca listesindeki filtreler ve hoca kartları",
  },
  {
    id: "02",
    title: "Deneme dersiyle tanış",
    description: "İlk dersini ücretsiz dene, hocanı beğendiğinden emin ol.",
    imageSrc: "/images/how-it-works/02-nazli-profile.png",
    imageAlt: "Nazlı Koç'un hoca profili",
  },
  {
    id: "03",
    title: "Paketini seç",
    description: "Sana uygun süreci belirle, indirimli paketini al.",
    imageSrc: "/images/how-it-works/03-package-selection.png",
    imageAlt: "Ders paketi ve paket süresi seçim ekranı",
  },
  {
    id: "04",
    title: "Platformdan derse gir",
    description:
      "Hocam'ın kendi video altyapısı üzerinden, tek tıkla dersine bağlan.",
    imageSrc: "/images/how-it-works/04-lesson-dashboard.png",
    imageAlt: "Öğrenci panelindeki derse katılma alanı",
  },
];

/**
 * The journey sits on its own full-bleed band.
 *
 * DESIGN.md separates sections by colour, not by containers: a band, no
 * border, no shadow, no wrapper. Section padding is the documented rhythm,
 * 96 desktop and 64 mobile.
 *
 * `--surface` rather than `--pink-pale`, because the testimonials directly
 * underneath already own the one permitted pale-pink section surface and two
 * pale bands in a row stop separating anything. White on paper is the same
 * value step the cards use, held at section scale, and it is themed, so
 * Night mode gets #182225 for free where a fixed campaign surface would have
 * needed pinned ink.
 *
 * Gold and pink were both tried here and rejected. Gold cannot carry white
 * type at all (1.46:1) and its compliant pairing is `--gold-ink`; pink can
 * (4.05:1) but would have made this the page's second full-bleed pink band,
 * against a 20 to 30% budget. A themed neutral needs neither exception.
 */
export function YsHowItWorks({
  v2 = false,
  lessonRoomShot = false,
}: {
  v2?: boolean;
  /** Whether public/images/how-it-works/05-lesson-room.png exists. */
  lessonRoomShot?: boolean;
}) {
  if (v2) return <YsStudentJourney lessonRoomShot={lessonRoomShot} />;

  return (
    <div
      id={JOURNEY_SECTION_ID}
      /* The sticky header would otherwise cover the heading when the nav
         scrolls here. */
      className="scroll-mt-[calc(var(--app-header-h)+24px)] bg-surface py-16 md:py-24"
    >
      <div className="ys-shell">
        <VerticalTabs
          heading={<YsJourneyHeading />}
          items={JOURNEY_STEPS}
          autoplayMs={5_000}
        />
      </div>
    </div>
  );
}

export const LESSON_ROOM_SHOT_PATH = "/images/how-it-works/05-lesson-room.png";

const STUDENT_STEP_FACTS = {
  trialMinutes: TRIAL_MINUTES,
  trialLimit: MONTHLY_TRIAL_LIMIT,
  weeklyMin: LESSONS_PER_WEEK.min,
  weeklyMax: LESSONS_PER_WEEK.max,
  shortestPlan: PLAN_DURATIONS[0].label.toLocaleLowerCase("tr-TR"),
  longestPlan: PLAN_DURATIONS[PLAN_DURATIONS.length - 1].label.toLocaleLowerCase("tr-TR"),
  paymentChargedWhen: (
    <YsFact value={PAYMENT_CHARGED_WHEN} label="Ödeme adımı: ödeme sağlayıcısı canlıya alınınca yazılacak" />
  ),
  remainingOnSwitch: <YsFact value={REMAINING_ON_SWITCH_TEXT} label="kalan dersler: D6" />,
};

/** The seven student steps, with their facts filled in. */
export function studentSteps(): YsStep[] {
  return copy.steps.map((step) => ({
    title: step.title,
    body: step.body(STUDENT_STEP_FACTS),
  }));
}

/* The screenshots' own ratio, as in VerticalTabs. */
const SHOT_WIDTH = 2880;
const SHOT_HEIGHT = 1645;

function Shot({
  src,
  alt,
  caption,
  wide,
}: {
  src: string;
  alt: string;
  caption: string;
  wide?: boolean;
}) {
  return (
    <figure
      className={`m-0 overflow-hidden rounded-card border border-line bg-paper ${wide ? "lg:col-span-2" : ""}`}
    >
      <Image
        src={src}
        alt={alt}
        width={SHOT_WIDTH}
        height={SHOT_HEIGHT}
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="h-auto w-full"
      />
      <figcaption className="border-t border-line bg-surface px-[18px] py-3 text-[13px] text-ink-mid">
        {caption}
      </figcaption>
    </figure>
  );
}

/* Development-only stand-in until the lesson room screenshot exists. */
const PLACEHOLDER_STRIPES: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, var(--paper) 0 12px, var(--skeleton) 12px 13px)",
};

/**
 * The rebuilt student section (NEXT_PUBLIC_HOME_V2): the rotating heading as
 * it was, a subline, all seven steps visible on the left, and the product
 * screenshots on the right, sticky under the header on wide screens.
 *
 * It sits on paper inside the shell, as the mockup has it, rather than on the
 * full-bleed surface band the tabbed version uses.
 */
function YsStudentJourney({ lessonRoomShot }: { lessonRoomShot: boolean }) {
  const showRoomPlaceholder = !lessonRoomShot && process.env.NODE_ENV !== "production";
  return (
    <section
      id="ogrenciler"
      aria-labelledby={JOURNEY_SECTION_ID}
      className="ys-shell scroll-mt-[calc(var(--app-header-h)+24px)] pt-[88px] md:pt-[120px]"
    >
      {/* Keeps the nav's "Nasıl çalışır" anchor landing on this section. */}
      <h2
        id={JOURNEY_SECTION_ID}
        className={`${YS_SECTION_HEADING_CLASSNAME} scroll-mt-[calc(var(--app-header-h)+24px)]`}
      >
        <YsJourneyHeading />
      </h2>
      <p className="mx-auto mt-5 max-w-[52ch] text-center text-body-l text-ink-mid">{copy.sub}</p>

      <div className="mt-14 grid grid-cols-1 items-start gap-x-16 gap-y-8 lg:grid-cols-12">
        <YsStepList className="min-w-0 lg:col-span-5" steps={studentSteps()} />

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:sticky lg:top-[calc(var(--app-header-h)+24px)] lg:col-span-7 lg:grid-cols-2">
          <Shot wide src="/images/how-it-works/01-tutor-list.png" {...copy.shots.tutorList} />
          <Shot wide src="/images/how-it-works/03-package-selection.png" {...copy.shots.packageSelection} />
          <Shot src="/images/how-it-works/04-lesson-dashboard.png" {...copy.shots.lessonDashboard} />
          {lessonRoomShot ? (
            <Shot src={LESSON_ROOM_SHOT_PATH} {...copy.shots.lessonRoom} />
          ) : (
            showRoomPlaceholder && (
              <div
                data-todo-fact="lesson-room-shot"
                className="grid aspect-video place-items-center rounded-card border border-line p-6 text-center text-small text-ink-mid lg:aspect-auto"
                style={PLACEHOLDER_STRIPES}
              >
                {copy.lessonRoomPlaceholder}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
