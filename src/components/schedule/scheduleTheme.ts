import type { ScheduleEvent, StudyBlockType } from "@/types";

/**
 * The visual language of the calendar.
 *
 * The one rule the product cares about: a real Hocam lesson must never look
 * like something the student typed in. Lessons and coaching are drawn as
 * outlined, tinted cards with a lock; personal study blocks are solid colour
 * with a checkbox. Colour alone is not the signal — the fill style, the lock
 * and the checkbox all carry it, so it survives colour-blindness and greyscale.
 */

export type ScheduleTone = {
  /** Card surface for the daily/weekly views. */
  card: string;
  /** Small dot used in the month grid chips. */
  dot: string;
  /** Text colour for the small type label above the title. */
  label: string;
  /** Category name shown above the title. */
  kindLabel: string;
};

const STUDY_TONES: Record<StudyBlockType, ScheduleTone> = {
  konu_anlatim: {
    card: "bg-sky-500 text-white border-transparent dark:bg-sky-600",
    dot: "bg-sky-500",
    label: "text-white/75",
    kindLabel: "Konu Anlatımı",
  },
  soru_cozumu: {
    card: "bg-emerald-500 text-white border-transparent dark:bg-emerald-600",
    dot: "bg-emerald-500",
    label: "text-white/75",
    kindLabel: "Soru Çözümü",
  },
  deneme: {
    card: "bg-amber-500 text-white border-transparent dark:bg-amber-600",
    dot: "bg-amber-500",
    label: "text-white/80",
    kindLabel: "Deneme",
  },
  custom: {
    card: "bg-slate-600 text-white border-transparent dark:bg-slate-700",
    dot: "bg-slate-500",
    label: "text-white/75",
    kindLabel: "Çalışma",
  },
};

const LESSON_TONE: ScheduleTone = {
  card: "bg-brand-50 text-brand-900 border-brand-300 dark:bg-brand-900/30 dark:text-brand-100 dark:border-brand-700",
  dot: "bg-brand-500",
  label: "text-brand-600 dark:text-brand-300",
  kindLabel: "Hocam Dersi",
};

const COACHING_TONE: ScheduleTone = {
  card: "bg-indigo-50 text-indigo-900 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-100 dark:border-indigo-700",
  dot: "bg-indigo-500",
  label: "text-indigo-600 dark:text-indigo-300",
  kindLabel: "Koçluk Görüşmesi",
};

export function toneForEvent(event: ScheduleEvent): ScheduleTone {
  if (event.source === "booking") return LESSON_TONE;
  if (event.source === "coaching") return COACHING_TONE;
  return STUDY_TONES[event.block_type ?? "custom"];
}

/** True when the student may tick, edit or delete this event. */
export function isPersonal(event: ScheduleEvent): boolean {
  return event.source === "study_block";
}

const LESSON_STATUS_LABELS: Record<string, string> = {
  pending: "Onay bekliyor",
  confirmed: "Onaylandı",
  in_progress: "Devam ediyor",
  awaiting_confirmation: "Onayın bekleniyor",
  completed: "Tamamlandı",
  disputed: "İtiraz sürecinde",
  scheduled: "Planlandı",
  reschedule_requested: "Saat değişikliği istendi",
  awaiting_report: "Rapor bekleniyor",
  student_no_show: "Katılmadın",
  tutor_no_show: "Hoca katılmadı",
  technical_failure: "Teknik sorun",
};

export function lessonStatusLabel(status: string): string {
  return LESSON_STATUS_LABELS[status] ?? status;
}

export const STUDY_BLOCK_TYPE_OPTIONS: { value: StudyBlockType; label: string }[] = [
  { value: "konu_anlatim", label: STUDY_TONES.konu_anlatim.kindLabel },
  { value: "soru_cozumu", label: STUDY_TONES.soru_cozumu.kindLabel },
  { value: "deneme", label: STUDY_TONES.deneme.kindLabel },
  { value: "custom", label: STUDY_TONES.custom.kindLabel },
];
