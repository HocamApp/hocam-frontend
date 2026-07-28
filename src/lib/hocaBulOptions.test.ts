import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AVAILABILITY_ORDER,
  CHALLENGE_ORDER,
  TEACHING_STYLE_ORDER,
  buildReviewRows,
  toAvailabilityOptions,
  toBudgetOptions,
  toChallengeOptions,
  toExamAreaOptions,
  toStageOptions,
  toSubjectOptions,
  toTeachingStyleOptions,
} from "./hocaBulOptions";
import type { MatchSubjectOption, MatchingOptions } from "@/types";

const subjects: MatchSubjectOption[] = [
  { key: "matematik", label: "Matematik", subject_ids: ["1"], exam_types: ["TYT", "AYT"], tutor_count: 12 },
  { key: "edebiyat", label: "Edebiyat", subject_ids: ["2"], exam_types: ["AYT"], tutor_count: 4 },
  { key: "ingilizce", label: "İngilizce", subject_ids: ["4"], exam_types: ["YDT"], tutor_count: 3 },
  { key: "kimya", label: "Kimya", subject_ids: ["3"], exam_types: ["AYT"], tutor_count: 0 },
];

const options: MatchingOptions = {
  goals: [
    { value: "YKS", label: "YKS" },
    { value: "UNDECIDED", label: "Henüz karar vermedim" },
  ],
  stages: {
    YKS: [{ value: "grade_12", label: "12. sınıf" }],
    DGS: [{ value: "ongoing", label: "Bir süredir hazırlanıyorum" }],
    KPSS: [],
    UNDECIDED: [{ value: "exploring", label: "Hedefimi belirlemeye çalışıyorum" }],
  },
  subjects,
  budget_ranges: [
    { id: "balanced", label: "Dengeli", min: 400, max: 700 },
    { id: "flexible", label: "Fiyat konusunda esneğim", min: null, max: null },
  ],
};

describe("option adapters keep server values verbatim", () => {
  it("uses the server's stage values and labels", () => {
    assert.deepEqual(toStageOptions(options, "YKS"), [
      { value: "grade_12", label: "12. sınıf" },
    ]);
    assert.deepEqual(toStageOptions(options, undefined), []);
  });

  it("uses the approved KPSS wording without changing its API value", () => {
    const withKpssStage: MatchingOptions = {
      ...options,
      stages: {
        ...options.stages,
        KPSS: [{ value: "ongoing", label: "Düzenli hazırlanıyorum" }],
      },
    };
    assert.deepEqual(toStageOptions(withKpssStage, "KPSS"), [
      { value: "ongoing", label: "Bir süredir hazırlanıyorum" },
    ]);
  });

  it("uses the subject key as the submitted value and shows the real tutor count", () => {
    const adapted = toSubjectOptions(options);
    assert.deepEqual(
      adapted.map((option) => option.value),
      ["matematik", "edebiyat", "ingilizce"]
    );
    assert.equal(adapted[0].detail, "12 hoca");
  });

  it("hides a subject group with no visible tutors", () => {
    assert.equal(
      toSubjectOptions(options).some((option) => option.value === "kimya"),
      false
    );
  });

  it("filters subjects by the chosen YKS areas and shows everything for unsure", () => {
    assert.deepEqual(
      toSubjectOptions(options, ["TYT"]).map((option) => option.value),
      ["matematik"]
    );
    assert.deepEqual(
      toSubjectOptions(options, ["unsure"]).map((option) => option.value),
      ["matematik", "edebiyat", "ingilizce"]
    );
  });

  it("returns the union for multiple areas and hides invalid runtime counts", () => {
    const unsafeOptions = {
      ...options,
      subjects: [
        ...subjects,
        { key: "eksik", label: "Eksik", subject_ids: ["5"], exam_types: ["TYT"] },
        { key: "sonsuz", label: "Sonsuz", subject_ids: ["6"], exam_types: ["TYT"], tutor_count: Number.POSITIVE_INFINITY },
      ],
    } as MatchingOptions;

    assert.deepEqual(
      toSubjectOptions(unsafeOptions, ["AYT", "YDT"]).map((option) => option.value),
      ["matematik", "edebiyat", "ingilizce"]
    );
    assert.equal(toSubjectOptions(unsafeOptions).some((option) => option.value === "eksik"), false);
    assert.equal(toSubjectOptions(unsafeOptions).some((option) => option.value === "sonsuz"), false);
  });

  it("offers the exact P3A exam-area choices and details", () => {
    assert.deepEqual(toExamAreaOptions(subjects), [
      { value: "TYT", label: "TYT", detail: "Temel Yeterlilik" },
      { value: "AYT", label: "AYT", detail: "Alan Yeterlilik" },
      { value: "YDT", label: "YDT", detail: "Yabancı Dil" },
      { value: "unsure", label: "Emin değilim" },
    ]);
  });

  it("formats full, minimum-only, maximum-only and no-price budget bands", () => {
    const adapted = toBudgetOptions({
      ...options,
      budget_ranges: [
        { id: "balanced", label: "Dengeli", min: 400, max: 700 },
        { id: "premium", label: "Premium", min: 900, max: null },
        { id: "economical", label: "Ekonomik", min: null, max: 250 },
        { id: "flexible", label: "Fiyat konusunda esneğim", min: null, max: null },
        { id: "balanced", label: "Belirsiz", min: null, max: null },
      ],
    });
    assert.deepEqual(adapted, [
      { value: "balanced", label: "Dengeli", detail: "₺400 – ₺700 / 40 dk" },
      { value: "premium", label: "Premium", detail: "₺900 ve üzeri / 40 dk" },
      { value: "economical", label: "Ekonomik", detail: "₺250’ye kadar / 40 dk" },
      { value: "flexible", label: "Fiyat konusunda esneğim", detail: "Tüm fiyat aralıklarını değerlendir" },
      { value: "balanced", label: "Belirsiz" },
    ]);
  });
});

describe("label maps cover every backend enum value", () => {
  it("keeps the exact backend values", () => {
    assert.deepEqual(CHALLENGE_ORDER, [
      "foundations",
      "question_solving",
      "speed_accuracy",
      "consistency",
      "where_to_start",
      "advanced_questions",
    ]);
    assert.deepEqual(TEACHING_STYLE_ORDER, [
      "foundations_patient",
      "question_speed",
      "planning_accountability",
      "motivating_communication",
      "high_target",
    ]);
    assert.deepEqual(AVAILABILITY_ORDER, [
      "weekday_day",
      "weekday_evening",
      "weekend_day",
      "weekend_evening",
      "flexible",
    ]);
  });

  it("adapts every P3B enum with its exact API value and approved copy", () => {
    assert.deepEqual(toChallengeOptions(), [
      { value: "foundations", label: "Konu temellerim eksik" },
      { value: "question_solving", label: "Konuyu biliyorum ama soruda takılıyorum" },
      { value: "speed_accuracy", label: "Netlerimi ve hızımı artırmam gerek" },
      { value: "consistency", label: "Düzenli çalışamıyorum" },
      { value: "where_to_start", label: "Nereden başlayacağımı bilmiyorum" },
      { value: "advanced_questions", label: "Daha zor sorulara geçmek istiyorum" },
    ]);
    assert.equal(toTeachingStyleOptions()[0].detail, "Konuyu adım adım kurar.");
    assert.deepEqual(toAvailabilityOptions().map((option) => option.value), AVAILABILITY_ORDER);
  });
});

describe("review rows", () => {
  const answers = {
    goal: "YKS" as const,
    stage: "grade_12",
    subject_keys: ["matematik"],
    challenges: ["foundations" as const],
    teaching_styles: ["question_speed" as const],
    availability_windows: ["weekday_evening" as const],
    budget_segment: "balanced" as const,
  };

  it("includes the YKS area row only for YKS, flagged as client-only", () => {
    const yksRows = buildReviewRows(answers, { yks_alan: ["TYT"] }, options);
    const areaRow = yksRows.find((row) => row.stepId === "yks_alan");
    assert.equal(areaRow?.isClientOnly, true);
    assert.equal(areaRow?.value, "TYT");
    assert.equal(yksRows.length, 8);

    const dgsRows = buildReviewRows({ ...answers, goal: "UNDECIDED" }, {}, options);
    assert.equal(dgsRows.some((row) => row.stepId === "yks_alan"), false);
    assert.equal(dgsRows.length, 7);
  });

  it("localizes every answer", () => {
    const rows = buildReviewRows(answers, {}, options);
    const byStep = Object.fromEntries(rows.map((row) => [row.stepId, row.value]));
    assert.equal(byStep.hedef, "YKS");
    assert.equal(byStep.asama, "12. sınıf");
    assert.equal(byStep.dersler, "Matematik");
    assert.equal(byStep.zorluk, "Konu temellerim eksik");
    assert.equal(byStep.hoca_yaklasimi, "Bol soru çözdüren");
    assert.equal(byStep.uygun_zamanlar, "Hafta içi akşam");
    assert.equal(byStep.butce, "Dengeli");
  });

  it("renders empty values instead of crashing before the options arrive", () => {
    const rows = buildReviewRows(answers, {}, undefined);
    assert.equal(rows.find((row) => row.stepId === "hedef")?.value, "YKS");
    assert.equal(rows.find((row) => row.stepId === "asama")?.value, "grade_12");
  });
});
