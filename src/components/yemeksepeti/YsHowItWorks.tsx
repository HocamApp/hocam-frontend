import {
  VerticalTabs,
  type VerticalTabItem,
} from "@/components/ui/vertical-tabs";

import { YsFact } from "./YsFact";
import { YsJourneyHeading } from "./YsJourneyHeading";
import { YS_SECTION_HEADING_CLASSNAME } from "./YsPillHeading";
import { YsStepTabs, type YsTabStep } from "./YsStepTabs";
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

const SHOTS_DIR = "/images/how-it-works";
export const LESSON_ROOM_SHOT_PATH = `${SHOTS_DIR}/05-lesson-room.png`;

const STUDENT_STEP_FACTS = {
  trialMinutes: TRIAL_MINUTES,
  trialLimit: MONTHLY_TRIAL_LIMIT,
  weeklyMin: LESSONS_PER_WEEK.min,
  weeklyMax: LESSONS_PER_WEEK.max,
  shortestPlan: PLAN_DURATIONS[0].label.toLocaleLowerCase("tr-TR"),
  longestPlan: PLAN_DURATIONS[PLAN_DURATIONS.length - 1].label.toLocaleLowerCase("tr-TR"),
  paymentChargedWhen: (
    <YsFact value={PAYMENT_CHARGED_WHEN} label="Ödeme adımı" />
  ),
  remainingOnSwitch: <YsFact value={REMAINING_ON_SWITCH_TEXT} label="kalan dersler: D6" />,
};

/**
 * Which screenshot each of the seven steps shows. "Derse gir" shows the
 * lesson room once its screenshot exists, the lesson dashboard until then.
 */
function studentShotFiles(lessonRoomShot: boolean) {
  const files = {
    tutorList: `${SHOTS_DIR}/01-tutor-list.png`,
    tutorProfile: `${SHOTS_DIR}/02-nazli-profile.png`,
    packageSelection: `${SHOTS_DIR}/03-package-selection.png`,
    lessonDashboard: `${SHOTS_DIR}/04-lesson-dashboard.png`,
    lessonRoom: LESSON_ROOM_SHOT_PATH,
  } as const;
  const keys = [
    "tutorList",
    "tutorProfile",
    "tutorProfile",
    "packageSelection",
    "packageSelection",
    lessonRoomShot ? "lessonRoom" : "lessonDashboard",
    "lessonDashboard",
  ] as const;
  return keys.map((key) => ({ key, src: files[key] }));
}

/** The seven student steps, with their facts and screenshots filled in. */
export function studentSteps(lessonRoomShot = false): YsTabStep[] {
  const shots = studentShotFiles(lessonRoomShot);
  return copy.steps.map((step, index) => {
    const { key, src } = shots[index];
    return {
      title: step.title,
      body: step.body(STUDENT_STEP_FACTS),
      shot: {
        src,
        alt: copy.shots[key].alt,
        caption: copy.shotCaption(index + 1, copy.shots[key].caption),
      },
    };
  });
}

/**
 * The rebuilt student section (NEXT_PUBLIC_HOME_V2): the rotating heading as
 * it was, a subline, the seven steps on the left and the active step's
 * screenshot on the right, sticky under the header on wide screens.
 *
 * It sits on paper inside the shell, as the mockup has it, rather than on the
 * full-bleed surface band the tabbed version uses. The section's top space
 * is on the outer element: `.ys-shell` sets its own padding and margin and
 * would override it.
 */
function YsStudentJourney({ lessonRoomShot }: { lessonRoomShot: boolean }) {
  return (
    <section
      id="ogrenciler"
      aria-labelledby={JOURNEY_SECTION_ID}
      className="mt-[88px] scroll-mt-[calc(var(--app-header-h)+24px)] md:mt-[120px]"
    >
      <div className="ys-shell">
        {/* Keeps the nav's "Nasıl çalışır" anchor landing on this section. */}
        <h2
          id={JOURNEY_SECTION_ID}
          className={`${YS_SECTION_HEADING_CLASSNAME} scroll-mt-[calc(var(--app-header-h)+24px)]`}
        >
          <YsJourneyHeading />
        </h2>
        <p className="mx-auto mt-5 max-w-[52ch] text-center text-[18px] leading-7 text-ink-mid">{copy.sub}</p>

        <YsStepTabs className="mt-14" label={copy.stepsLabel} steps={studentSteps(lessonRoomShot)} />
      </div>
    </section>
  );
}
