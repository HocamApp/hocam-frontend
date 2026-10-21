import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingExamAnalysisStatus, CoachingReportDraftInput } from "./coachingApi";
import {
  REPORT_EMPTY_EXAM,
  REPORT_FIELD_RULES,
  REPORT_STEPS,
  buildReportPayload,
  createReportExamForm,
  diffReportPayload,
  reportChecklist,
  reportCounter,
  reportDeadlineNotice,
  reportPreviewRevision,
  reportStepStates,
  toReportExamAnalysis,
} from "./coachingReportDraft";
import { coachingDateTimeLabel } from "./coachingTime";

const LONG_50 = "Haftalık program gözden geçirildi; türevde ilerleme iyi, paragrafta süre sorunu var.";
const LONG_20 = "Türev uygulamaları ve süre yönetimi";

function draft(overrides: Partial<CoachingReportDraftInput> = {}): CoachingReportDraftInput {
  return {
    short_summary: "",
    topics_discussed: "",
    student_progress: "",
    next_priorities: "",
    study_recommendations: "",
    focus_until_next_meeting: "",
    ...overrides,
  };
}

const complete = draft({
  short_summary: LONG_50,
  topics_discussed: LONG_20,
  student_progress: LONG_20,
  next_priorities: LONG_20,
  study_recommendations: LONG_20,
  focus_until_next_meeting: LONG_20,
});

describe("REPORT_STEPS", () => {
  it("is the five parts of the report plus the review, in order, with Kaynaklar optional", () => {
    assert.deepEqual(
      REPORT_STEPS.map((step) => step.label),
      ["Özet", "İlerleme", "Öncelikler", "Sınav analizi", "Kaynaklar", "Gözden geçir"],
    );
    assert.deepEqual(
      REPORT_STEPS.filter((step) => step.optional).map((step) => step.key),
      ["resources"],
    );
  });

  it("gives every written field a label, an example and the length the server asks for", () => {
    assert.deepEqual(
      REPORT_FIELD_RULES.map((rule) => [rule.field, rule.label, rule.min]),
      [
        ["short_summary", "Kısa özet", 50],
        ["topics_discussed", "Görüşülen konular", 20],
        ["student_progress", "Öğrencinin ilerlemesi", 20],
        ["next_priorities", "Sonraki öncelikler", 20],
        ["study_recommendations", "Çalışma önerileri", 20],
        ["focus_until_next_meeting", "Bir sonraki görüşmeye kadar odak", 20],
      ],
    );
    for (const rule of REPORT_FIELD_RULES) assert.ok(rule.hint.length > 10, rule.field);
  });
});

describe("reportCounter", () => {
  it("counts what the server counts: the trimmed length", () => {
    assert.deepEqual(reportCounter("  abc  ", 50), { text: "3 / en az 50", met: false });
    assert.deepEqual(reportCounter("", 20), { text: "0 / en az 20", met: false });
  });

  it("is met at exactly the minimum", () => {
    assert.equal(reportCounter("x".repeat(20), 20).met, true);
    assert.equal(reportCounter("x".repeat(19), 20).met, false);
  });
});

describe("reportChecklist", () => {
  it("lists every thing the server wants before the first publish, in the order of the form", () => {
    const items = reportChecklist({ draft: draft(), examStatus: "", programMissing: false });

    assert.deepEqual(
      items.map((item) => item.label),
      [
        "Kısa özet",
        "Görüşülen konular",
        "Öğrencinin ilerlemesi",
        "Sonraki öncelikler",
        "Çalışma önerileri",
        "Bir sonraki görüşmeye kadar odak",
        "Deneme durumu",
      ],
    );
    assert.ok(items.every((item) => !item.done));
  });

  it("says how many characters are still missing, not just that something is", () => {
    const items = reportChecklist({
      draft: draft({ short_summary: "x".repeat(36), topics_discussed: "y".repeat(19) }),
      examStatus: "",
      programMissing: false,
    });

    assert.equal(items[0].message, "Kısa özet: 14 karakter daha");
    assert.equal(items[1].message, "Görüşülen konular: 1 karakter daha");
    assert.equal(items[6].message, "Deneme durumu: bir seçenek seç");
  });

  it("points each item at the step that holds it", () => {
    const items = reportChecklist({ draft: draft(), examStatus: "", programMissing: true });

    assert.deepEqual(
      items.map((item) => item.step),
      ["summary", "summary", "progress", "priorities", "priorities", "priorities", "exam", "review"],
    );
  });

  it("is complete when the fields are long enough and an exam status is chosen", () => {
    const items = reportChecklist({ draft: complete, examStatus: "no_new_result", programMissing: false });

    assert.ok(items.every((item) => item.done));
    assert.deepEqual(
      items.filter((item) => !item.done),
      [],
    );
  });

  it("asks for a short reason only when the period has no study program", () => {
    const without = reportChecklist({ draft: complete, examStatus: "analyzed", programMissing: true });
    const reason = without.find((item) => item.key === "no_program_reason");
    assert.equal(reason?.done, false);
    assert.equal(reason?.message, "Program yoksa kısa gerekçe yaz");

    const answered = reportChecklist({
      draft: { ...complete, no_program_reason: "Deneme sonuçlarını bekliyoruz." },
      examStatus: "analyzed",
      programMissing: true,
    });
    assert.equal(answered.find((item) => item.key === "no_program_reason")?.done, true);

    const hasProgram = reportChecklist({ draft: complete, examStatus: "analyzed", programMissing: false });
    assert.equal(hasProgram.find((item) => item.key === "no_program_reason"), undefined);
  });
});

describe("reportStepStates", () => {
  const states = (
    current: Parameters<typeof reportStepStates>[0]["current"],
    d = draft(),
    examStatus: CoachingExamAnalysisStatus | "" = "",
    hasResources = false,
  ) =>
    reportStepStates({
      checklist: reportChecklist({ draft: d, examStatus, programMissing: false }),
      hasResources,
      current,
    });

  it("marks the open step, ticks the finished ones and leaves the rest waiting", () => {
    const result = states(
      "progress",
      draft({ short_summary: LONG_50, topics_discussed: LONG_20 }),
    );

    assert.deepEqual(result, {
      summary: "done",
      progress: "current",
      priorities: "todo",
      exam: "todo",
      resources: "todo",
      review: "todo",
    });
  });

  it("keeps the open step marked open even when its own fields are already complete", () => {
    assert.equal(states("summary", complete, "analyzed").summary, "current");
  });

  it("ticks Kaynaklar only when there is something in it, since it is optional", () => {
    assert.equal(states("summary", complete, "analyzed", false).resources, "todo");
    assert.equal(states("summary", complete, "analyzed", true).resources, "done");
  });

  it("opens the review step like any other", () => {
    assert.equal(states("review", complete, "analyzed").review, "current");
  });
});

describe("reportDeadlineNotice", () => {
  const due = "2026-10-13T23:15:00Z";
  const eligibleAt = "2026-10-14T23:15:00Z";

  it("says there is no ordinary report for a meeting that closed as an incident", () => {
    assert.deepEqual(
      reportDeadlineNotice({ reportDueAt: null, reportOverdue: false, complaintEligibleAt: null, complaintEligible: false }),
      {
        kind: "no_report",
        title: "Bu görüşme için normal rapor yok",
        text: "Bu görüşme katılım sorunu ya da teknik sorunla kapandığı için rapor yazman gerekmez.",
      },
    );
  });

  it("gives a deadline that has not passed as a small caption over the date, with no warning sentence", () => {
    assert.deepEqual(
      reportDeadlineNotice({ reportDueAt: due, reportOverdue: false, complaintEligibleAt: eligibleAt, complaintEligible: false }),
      { kind: "due", caption: "Son tarih", value: coachingDateTimeLabel(due), urgent: false, text: null },
    );
  });

  it("says plainly what a late report means once the student can report it", () => {
    assert.deepEqual(
      reportDeadlineNotice({ reportDueAt: due, reportOverdue: true, complaintEligibleAt: eligibleAt, complaintEligible: true }),
      {
        kind: "due",
        caption: "Son tarih",
        value: coachingDateTimeLabel(due),
        urgent: true,
        text: "Süre geçti. Öğrenci bu görüşme için rapor eksikliğini bildirebilir; raporu hemen yayınla.",
      },
    );
  });

  it("says from when the student can report it while that day has not come", () => {
    const notice = reportDeadlineNotice({ reportDueAt: due, reportOverdue: true, complaintEligibleAt: eligibleAt, complaintEligible: false });

    assert.equal(notice.kind, "due");
    assert.equal(
      notice.kind === "due" ? notice.text : null,
      `Süre geçti. ${coachingDateTimeLabel(eligibleAt)} itibarıyla öğrenci bu görüşme için rapor eksikliğini bildirebilir; raporu hemen yayınla.`,
    );
  });

  it("does not invent a date the server did not give", () => {
    const notice = reportDeadlineNotice({ reportDueAt: due, reportOverdue: true, complaintEligibleAt: null, complaintEligible: false });

    assert.equal(notice.kind === "due" ? notice.text : null, "Süre geçti; raporu hemen yayınla.");
  });
});

describe("exam form", () => {
  it("round-trips an analysed result, one item per line", () => {
    const form = {
      ...REPORT_EMPTY_EXAM,
      status: "analyzed" as const,
      exam_type: " YKS ",
      exam_name: "Deneme 3",
      date: "2026-10-12",
      score_or_net: "78.5",
      strengths: "Türev\n\nLimit \n",
      focus_areas: "Paragraf",
      tutor_interpretation: " Süre sorunu ",
      next_actions: "Her gün 2 set\nHata defteri",
    };

    const analysis = toReportExamAnalysis(form);
    assert.deepEqual(analysis, {
      status: "analyzed",
      exam_type: "YKS",
      exam_name: "Deneme 3",
      date: "2026-10-12",
      score_or_net: 78.5,
      strengths: ["Türev", "Limit"],
      focus_areas: ["Paragraf"],
      tutor_interpretation: "Süre sorunu",
      next_actions: ["Her gün 2 set", "Hata defteri"],
    });

    const back = createReportExamForm(analysis);
    assert.equal(back.strengths, "Türev\nLimit");
    assert.equal(back.score_or_net, "78.5");
    assert.equal(back.status, "analyzed");
  });

  it("keeps any other status on its own: details only describe an analysed result", () => {
    assert.deepEqual(
      toReportExamAnalysis({ ...REPORT_EMPTY_EXAM, status: "no_new_result", exam_name: "Eski ad" }),
      { status: "no_new_result" },
    );
  });

  it("is empty for a form nobody touched, and for no analysis at all", () => {
    assert.deepEqual(toReportExamAnalysis(REPORT_EMPTY_EXAM), {});
    assert.deepEqual(createReportExamForm(null), REPORT_EMPTY_EXAM);
  });
});

describe("buildReportPayload", () => {
  it("sends the exam analysis and only the resources that have a title, trimmed", () => {
    const payload = buildReportPayload({
      draft: complete,
      exam: { ...REPORT_EMPTY_EXAM, status: "no_new_result" },
      resources: [
        { title: " Paragraf seti ", url: " https://example.com/a ", note: " ", attachment_id: "" },
        { title: "   ", url: "https://example.com/b" },
      ],
    });

    assert.deepEqual(payload.exam_analysis, { status: "no_new_result" });
    assert.deepEqual(payload.recommended_resources, [
      { title: "Paragraf seti", url: "https://example.com/a" },
    ]);
    assert.equal(payload.short_summary, LONG_50);
  });
});

describe("diffReportPayload", () => {
  const base = buildReportPayload({ draft: complete, exam: REPORT_EMPTY_EXAM, resources: [] });

  it("is empty when nothing changed", () => {
    assert.deepEqual(diffReportPayload(base, base), {});
  });

  it("carries only what changed, so another place that wrote other fields is not overwritten", () => {
    const next = { ...base, short_summary: `${LONG_50} Yeni cümle.`, no_program_reason: "Bekliyoruz." };

    assert.deepEqual(diffReportPayload(next, base), {
      short_summary: `${LONG_50} Yeni cümle.`,
      no_program_reason: "Bekliyoruz.",
    });
  });

  it("compares the exam analysis and the resources by value", () => {
    const withExam = { ...base, exam_analysis: { status: "analyzed" as const } };
    const withResource = { ...base, recommended_resources: [{ title: "Set" }] };

    assert.deepEqual(diffReportPayload(withExam, base), { exam_analysis: { status: "analyzed" } });
    assert.deepEqual(diffReportPayload(withResource, base), { recommended_resources: [{ title: "Set" }] });
    assert.deepEqual(diffReportPayload({ ...withResource }, withResource), {});
  });
});

describe("reportPreviewRevision", () => {
  it("wraps a draft as the revision the student view reads", () => {
    const revision = reportPreviewRevision(complete, 3);

    assert.equal(revision.revision_number, 3);
    assert.equal(revision.content.short_summary, LONG_50);
    assert.equal(revision.change_note, null);
  });
});
