"use client";

/**
 * Permanent review board for the /hoca-bul illustration family.
 *
 * This component is the fixture the contact-sheet harness
 * (scripts/hoca-bul-illustration-shots.ts) renders. It is not routed in the
 * product: the harness mounts it through a short-lived route shim it writes
 * and deletes around each capture run, so the app never keeps a review page.
 *
 * Every step appears in its default state and representative answered states,
 * in the desktop square framing and in the 390x120 compact band, so one run
 * covers the whole visual matrix a change can affect.
 */

import { IllustrationFrame } from "@/components/hoca-bul/illustrations/IllustrationFrame";
import { toIllustrationState } from "@/components/hoca-bul/illustrations/illustrationState";
import type {
  HocaBulApiAnswersDraft,
  HocaBulClientAnswers,
  HocaBulStepId,
} from "@/types/hocaBul";

interface Case {
  label: string;
  answers?: HocaBulApiAnswersDraft;
  client?: HocaBulClientAnswers;
}

const CASES: Record<HocaBulStepId, Case[]> = {
  hedef: [
    { label: "hedef — default" },
    { label: "hedef — YKS", answers: { goal: "YKS" } },
    { label: "hedef — UNDECIDED", answers: { goal: "UNDECIDED" } },
  ],
  asama: [
    { label: "asama — default" },
    { label: "asama — active", answers: { stage: "grade_11" } },
    { label: "asama — returning", answers: { stage: "graduate" } },
  ],
  yks_alan: [
    { label: "yks_alan — default" },
    { label: "yks_alan — TYT + YDT", client: { yks_alan: ["TYT", "YDT"] } },
    { label: "yks_alan — unsure", client: { yks_alan: ["unsure"] } },
  ],
  dersler: [
    { label: "dersler — default" },
    { label: "dersler — one", answers: { subject_keys: ["matematik"] } },
    {
      label: "dersler — three",
      answers: { subject_keys: ["matematik", "fizik", "turkce"] },
    },
  ],
  zorluk: [
    { label: "zorluk — default" },
    { label: "zorluk — one", answers: { challenges: ["foundations"] } },
    {
      label: "zorluk — two",
      answers: { challenges: ["consistency", "foundations"] },
    },
  ],
  hoca_yaklasimi: [
    { label: "hoca_yaklasimi — default" },
    {
      label: "hoca_yaklasimi — one",
      answers: { teaching_styles: ["question_speed"] },
    },
    {
      label: "hoca_yaklasimi — two",
      answers: { teaching_styles: ["high_target", "foundations_patient"] },
    },
  ],
  uygun_zamanlar: [
    { label: "uygun_zamanlar — default" },
    {
      label: "uygun_zamanlar — weekday evening + weekend day",
      answers: { availability_windows: ["weekday_evening", "weekend_day"] },
    },
    {
      label: "uygun_zamanlar — flexible",
      answers: { availability_windows: ["flexible"] },
    },
  ],
  butce: [
    { label: "butce — default" },
    { label: "butce — balanced", answers: { budget_segment: "balanced" } },
    { label: "butce — flexible", answers: { budget_segment: "flexible" } },
  ],
  kontrol: [
    { label: "kontrol — default" },
    { label: "kontrol — 1 of 8", answers: { goal: "YKS" } },
    {
      label: "kontrol — 3 of 8",
      answers: { goal: "YKS", stage: "grade_11", subject_keys: ["matematik"] },
    },
  ],
};

const STEPS: HocaBulStepId[] = [
  "hedef",
  "asama",
  "yks_alan",
  "dersler",
  "zorluk",
  "hoca_yaklasimi",
  "uygun_zamanlar",
  "butce",
  "kontrol",
];

export function IllustrationReviewBoard({ dark }: { dark: boolean }) {
  // Layout-critical sizing is inline on purpose: this fixture lives in
  // scripts/, which Tailwind does not scan, so utility classes written here
  // would not be generated. Colour classes are safe — the same utilities are
  // already generated for src/.
  return (
    <div className={dark ? "dark" : undefined}>
      <div
        className="bg-background text-foreground"
        style={{ minHeight: "100vh", padding: 32 }}
      >
        <div
          data-review="desktop"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {STEPS.flatMap((step) =>
            CASES[step].map(({ label, answers, client }) => (
              <div key={label}>
                <div
                  className="bg-muted/30"
                  style={{ aspectRatio: "1 / 1", width: "100%", padding: 24 }}
                >
                  <IllustrationFrame
                    state={toIllustrationState(step, answers ?? {}, client ?? {})}
                  />
                </div>
                <p
                  className="text-xs text-muted-foreground"
                  style={{ marginTop: 8 }}
                >
                  {label}
                </p>
              </div>
            ))
          )}
        </div>

        <div
          data-review="band"
          style={{ marginTop: 48, width: 390, maxWidth: "100%" }}
        >
          {STEPS.flatMap((step) =>
            CASES[step].map(({ label, answers, client }) => (
              <div key={`band-${label}`} style={{ marginBottom: 16 }}>
                <div
                  data-band={label}
                  className="bg-muted/30"
                  style={{ width: "100%", height: 120 }}
                >
                  <IllustrationFrame
                    compact
                    state={toIllustrationState(step, answers ?? {}, client ?? {})}
                  />
                </div>
                <p
                  className="text-xs text-muted-foreground"
                  style={{ marginTop: 4 }}
                >
                  {label} — band
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
