import {
  normalizeScoreOrNet,
  type CoachingExamAnalysis,
  type CoachingExamAnalysisStatus,
  type CoachingRecommendedResource,
  type CoachingReportDraftInput,
  type CoachingSessionReportRevision,
} from "./coachingApi";
import { coachingDateTimeLabel } from "./coachingTime";

/** How long after the last keystroke the draft is saved on its own. */
export const REPORT_AUTOSAVE_DELAY_MS = 1500;

export type ReportStepKey = "summary" | "progress" | "priorities" | "exam" | "resources" | "review";

export interface ReportStep {
  key: ReportStepKey;
  label: string;
  /** Nothing is asked of the tutor here; the step is ticked only if it holds something. */
  optional?: boolean;
}

export const REPORT_STEPS: readonly ReportStep[] = [
  { key: "summary", label: "Özet" },
  { key: "progress", label: "İlerleme" },
  { key: "priorities", label: "Öncelikler" },
  { key: "exam", label: "Sınav analizi" },
  { key: "resources", label: "Kaynaklar", optional: true },
  { key: "review", label: "Gözden geçir" },
];

export type ReportTextField =
  | "short_summary"
  | "topics_discussed"
  | "student_progress"
  | "next_priorities"
  | "study_recommendations"
  | "focus_until_next_meeting";

export interface ReportFieldRule {
  field: ReportTextField;
  step: ReportStepKey;
  label: string;
  /** What to write and an example, shown under the label so it stays on screen while typing. */
  hint: string;
  /** The least the server accepts (trimmed length): phase6._validate_primary_report_for_publish. */
  min: number;
}

export const REPORT_FIELD_RULES: readonly ReportFieldRule[] = [
  {
    field: "short_summary",
    step: "summary",
    label: "Kısa özet",
    hint: "Görüşmenin bir iki cümlelik özeti. Öğrenci raporu açınca ilk bunu okur.",
    min: 50,
  },
  {
    field: "topics_discussed",
    step: "summary",
    label: "Görüşülen konular",
    hint: "Hangi konulara değindiniz? Örn: türev uygulamaları, paragraf süre yönetimi.",
    min: 20,
  },
  {
    field: "student_progress",
    step: "progress",
    label: "Öğrencinin ilerlemesi",
    hint: "Şu anki durumu ve bu görüşmedeki ilerlemesi. Neyi rahat yaptı, nerede takıldı?",
    min: 20,
  },
  {
    field: "next_priorities",
    step: "priorities",
    label: "Sonraki öncelikler",
    hint: "Sonraki dönemde hangi konulara öncelik verilecek?",
    min: 20,
  },
  {
    field: "study_recommendations",
    step: "priorities",
    label: "Çalışma önerileri",
    hint: "Önerdiğin çalışma yöntemi ya da düzen. Örn: süreli paragraf seti, hata defteri.",
    min: 20,
  },
  {
    field: "focus_until_next_meeting",
    step: "priorities",
    label: "Bir sonraki görüşmeye kadar odak",
    hint: "Öğrencinin bir sonraki görüşmeye kadar odaklanacağı şey. Örn: her gün 2 paragraf seti.",
    min: 20,
  },
];

export const REPORT_EMPTY_DRAFT: CoachingReportDraftInput = {
  short_summary: "",
  topics_discussed: "",
  student_progress: "",
  next_priorities: "",
  study_recommendations: "",
  focus_until_next_meeting: "",
  exam_analysis: {},
  recommended_resources: [],
  program_changes_summary: "",
};

export function reportCounter(value: string, min: number): { text: string; met: boolean } {
  const length = value.trim().length;
  return { text: `${length} / en az ${min}`, met: length >= min };
}

export interface ReportChecklistItem {
  key: string;
  step: ReportStepKey;
  label: string;
  done: boolean;
  /** What is still missing, as one short line ("Kısa özet: 14 karakter daha"). */
  message: string;
}

/**
 * Everything the server wants before a first report can be published, in the
 * order of the form. It mirrors phase6._validate_primary_report_for_publish, so
 * the tutor sees what is missing before pressing the button, not after.
 */
export function reportChecklist({
  draft,
  examStatus,
  programMissing,
}: {
  draft: CoachingReportDraftInput;
  examStatus: CoachingExamAnalysisStatus | "";
  /** The period has no study program, so a short reason is asked instead. */
  programMissing: boolean;
}): ReportChecklistItem[] {
  const items: ReportChecklistItem[] = REPORT_FIELD_RULES.map((rule) => {
    const length = (draft[rule.field] ?? "").trim().length;
    const done = length >= rule.min;
    return {
      key: rule.field,
      step: rule.step,
      label: rule.label,
      done,
      message: done ? rule.label : `${rule.label}: ${rule.min - length} karakter daha`,
    };
  });
  items.push({
    key: "exam_status",
    step: "exam",
    label: "Deneme durumu",
    done: Boolean(examStatus),
    message: examStatus ? "Deneme durumu" : "Deneme durumu: bir seçenek seç",
  });
  if (programMissing) {
    const done = Boolean((draft.no_program_reason ?? "").trim());
    items.push({
      key: "no_program_reason",
      step: "review",
      label: "Program gerekçesi",
      done,
      message: done ? "Program gerekçesi" : "Program yoksa kısa gerekçe yaz",
    });
  }
  return items;
}

export type ReportStepState = "done" | "current" | "todo";

export function reportStepStates({
  checklist,
  hasResources,
  current,
}: {
  checklist: readonly ReportChecklistItem[];
  hasResources: boolean;
  current: ReportStepKey;
}): Record<ReportStepKey, ReportStepState> {
  const finished = (step: ReportStepKey): boolean => {
    if (step === "review") return false;
    if (step === "resources") return hasResources;
    return checklist.filter((item) => item.step === step).every((item) => item.done);
  };
  const result = {} as Record<ReportStepKey, ReportStepState>;
  for (const { key } of REPORT_STEPS) {
    result[key] = key === current ? "current" : finished(key) ? "done" : "todo";
  }
  return result;
}

export interface ReportTimingInput {
  reportDueAt: string | null;
  reportOverdue: boolean;
  complaintEligibleAt: string | null;
  complaintEligible: boolean;
}

export type ReportDeadlineNotice =
  | { kind: "no_report"; title: string; text: string }
  | { kind: "due"; caption: "Son tarih"; value: string; urgent: boolean; text: string | null };

/**
 * What the tutor is told about the deadline. A late report says what it means
 * for the student in plain words (they can report it as missing), never in the
 * support-desk wording the server uses, and never anything about money.
 */
export function reportDeadlineNotice(timing: ReportTimingInput): ReportDeadlineNotice {
  if (!timing.reportDueAt) {
    return {
      kind: "no_report",
      title: "Bu görüşme için normal rapor yok",
      text: "Bu görüşme katılım sorunu ya da teknik sorunla kapandığı için rapor yazman gerekmez.",
    };
  }
  const value = coachingDateTimeLabel(timing.reportDueAt);
  if (!timing.reportOverdue) return { kind: "due", caption: "Son tarih", value, urgent: false, text: null };

  let text = "Süre geçti; raporu hemen yayınla.";
  if (timing.complaintEligible) {
    text = "Süre geçti. Öğrenci bu görüşme için rapor eksikliğini bildirebilir; raporu hemen yayınla.";
  } else if (timing.complaintEligibleAt) {
    text = `Süre geçti. ${coachingDateTimeLabel(timing.complaintEligibleAt)} itibarıyla öğrenci bu görüşme için rapor eksikliğini bildirebilir; raporu hemen yayınla.`;
  }
  return { kind: "due", caption: "Son tarih", value, urgent: true, text };
}

// --- The exam analysis form -------------------------------------------------------------------

export interface ReportExamForm {
  status: CoachingExamAnalysisStatus | "";
  exam_type: string;
  exam_name: string;
  date: string;
  score_or_net: string;
  strengths: string;
  focus_areas: string;
  tutor_interpretation: string;
  next_actions: string;
}

export const REPORT_EMPTY_EXAM: ReportExamForm = {
  status: "",
  exam_type: "",
  exam_name: "",
  date: "",
  score_or_net: "",
  strengths: "",
  focus_areas: "",
  tutor_interpretation: "",
  next_actions: "",
};

export function splitReportLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createReportExamForm(exam?: CoachingExamAnalysis | null): ReportExamForm {
  return {
    status: exam?.status ?? "",
    exam_type: String(exam?.exam_type ?? ""),
    exam_name: String(exam?.exam_name ?? ""),
    date: String(exam?.date ?? ""),
    score_or_net: String(exam?.score_or_net ?? ""),
    strengths: (exam?.strengths ?? []).join("\n"),
    focus_areas: (exam?.focus_areas ?? []).join("\n"),
    tutor_interpretation: String(exam?.tutor_interpretation ?? ""),
    next_actions: (exam?.next_actions ?? []).join("\n"),
  };
}

export function toReportExamAnalysis(exam: ReportExamForm): CoachingExamAnalysis {
  const output: CoachingExamAnalysis = {};
  if (exam.status) output.status = exam.status;
  // Details only describe an analysed result; any other status stands alone.
  if (exam.status && exam.status !== "analyzed") return output;
  if (exam.exam_type.trim()) output.exam_type = exam.exam_type.trim();
  if (exam.exam_name.trim()) output.exam_name = exam.exam_name.trim();
  if (exam.date) output.date = exam.date;
  const scoreOrNet = normalizeScoreOrNet(exam.score_or_net);
  if (scoreOrNet !== null) output.score_or_net = scoreOrNet;
  const strengths = splitReportLines(exam.strengths);
  const focusAreas = splitReportLines(exam.focus_areas);
  const nextActions = splitReportLines(exam.next_actions);
  if (strengths.length) output.strengths = strengths;
  if (focusAreas.length) output.focus_areas = focusAreas;
  if (exam.tutor_interpretation.trim()) output.tutor_interpretation = exam.tutor_interpretation.trim();
  if (nextActions.length) output.next_actions = nextActions;
  return output;
}

// --- The draft payload ------------------------------------------------------------------------

export function buildReportPayload({
  draft,
  exam,
  resources,
}: {
  draft: CoachingReportDraftInput;
  exam: ReportExamForm;
  resources: readonly CoachingRecommendedResource[];
}): CoachingReportDraftInput {
  return {
    ...draft,
    exam_analysis: toReportExamAnalysis(exam),
    recommended_resources: resources
      .filter((resource) => resource.title.trim())
      .map((resource) => ({
        title: resource.title.trim(),
        ...(resource.url?.trim() ? { url: resource.url.trim() } : {}),
        ...(resource.note?.trim() ? { note: resource.note.trim() } : {}),
        ...(resource.attachment_id ? { attachment_id: resource.attachment_id } : {}),
      })),
  };
}

/**
 * Only what changed since the last save. The server updates just the fields it
 * is sent, so the room's short form and the full report page can both save
 * without one wiping what the other wrote.
 */
export function diffReportPayload(
  current: CoachingReportDraftInput,
  saved: CoachingReportDraftInput,
): Partial<CoachingReportDraftInput> {
  const changes: Record<string, unknown> = {};
  const savedValues = saved as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(current)) {
    if (JSON.stringify(value) !== JSON.stringify(savedValues[key])) changes[key] = value;
  }
  return changes as Partial<CoachingReportDraftInput>;
}

/** A draft dressed as the published revision, so the student's own view can preview it. */
export function reportPreviewRevision(
  content: CoachingReportDraftInput,
  revisionNumber = 1,
): CoachingSessionReportRevision {
  return {
    id: "preview",
    revision_number: revisionNumber,
    source_draft_version: 0,
    content,
    published_at: "",
    change_note: null,
  };
}
