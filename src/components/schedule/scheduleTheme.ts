import {
  BookOpen,
  ClipboardText,
  GraduationCap,
  Lock,
  Note,
  PencilSimple,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

import type { ScheduleEvent, StudyBlockType } from "@/types";

/**
 * The visual language of the calendar.
 *
 * Every event is one shape: a solid subject-coloured surface with white text.
 * A calendar reads as a calendar when the blocks are blocks; the outlined
 * treatment lessons used to get made a booked lesson look like an empty slot
 * with a stripe next to it.
 *
 * The one rule the product cares about still holds: a real Hocam lesson must
 * never look like something the student typed in. Fill style no longer carries
 * that, so the other three carriers do, and each of them survives greyscale
 * and colour-blindness on its own:
 *   - the graduation cap or the coaching lock in the kind label
 *   - the "Hocam Dersi" / "Koçluk Görüşmesi" wording itself
 *   - the absence of a checkbox, an edit button and a delete button
 *
 * Lessons are tinted per subject (see SUBJECT_HUES) so a week of Matematik and
 * Felsefe does not read as one undifferentiated block.
 */

export type ScheduleTone = {
  /** Small badge left of the category label. */
  icon: PhosphorIcon;
  /** Card surface for the daily/weekly views. */
  card: string;
  /** Small dot used in the month grid chips. */
  dot: string;
  /** Text colour for the small type label above the title. */
  label: string;
  /** Category name shown above the title. */
  kindLabel: string;
};

/**
 * Fills are the -700 step, not -500.
 *
 * White on the -500 shades measured 2.15–2.77:1, far under the 4.5:1 WCAG AA
 * needs for body text, and the faded labels on top of them were worse
 * (white/80 on amber-500 was 1.85:1). Measured ratios for what is used now:
 * sky-700 5.93, emerald-700 5.48, amber-700 5.02, slate-600 7.58 — slate was
 * already passing and sets the bar for the others.
 *
 * Label opacity is per-tone for the same reason: white/90 clears 4.5 on sky
 * (5.13), emerald (4.78) and slate (6.53), but lands at 4.39 on amber, so
 * amber's label stays at full white. Hierarchy comes from size and weight,
 * not from washing the text out.
 *
 * Dots keep the -500 shade: they are decorative, sit on the page background,
 * and never carry text.
 */
const STUDY_TONES: Record<StudyBlockType, ScheduleTone> = {
  konu_anlatim: {
    icon: BookOpen,
    card: "bg-[var(--subject-1)] text-white border-transparent",
    dot: "bg-[var(--subject-1)]",
    label: "text-white/90",
    kindLabel: "Konu Anlatımı",
  },
  soru_cozumu: {
    icon: PencilSimple,
    card: "bg-[var(--subject-4)] text-white border-transparent",
    dot: "bg-[var(--subject-4)]",
    label: "text-white/90",
    kindLabel: "Soru Çözümü",
  },
  deneme: {
    icon: ClipboardText,
    card: "bg-[var(--subject-3)] text-white border-transparent",
    dot: "bg-[var(--subject-3)]",
    label: "text-white/90",
    kindLabel: "Deneme",
  },
  custom: {
    icon: Note,
    card: "bg-[var(--subject-6)] text-white border-transparent",
    dot: "bg-[var(--subject-6)]",
    label: "text-white/90",
    kindLabel: "Çalışma",
  },
};

export type SubjectHueId =
  | "mavi"
  | "lacivert"
  | "erguvan"
  | "zeytin"
  | "turkuaz"
  | "grafit";

export type SubjectHue = {
  id: SubjectHueId;
  /**
   * Solid surface, white text. Used for a student's own study block.
   *
   * The old shape was a -50 tint under -900 text of the same hue, which is the
   * banned tint-badge construction and read as washed out at chip size. Solid
   * fill with inverted text is the sanctioned one and is legible at 10px.
   */
  card: string;
  /** Kind label on that solid surface. */
  label: string;
  /** Decorative marker on the page background: month chips, subject totals. */
  dot: string;
  /** Icon tile on the subject-totals cards. Solid, white glyph. */
  chip: string;
};

/**
 * Six hues, from `--subject-1` through `--subject-6` in globals.css.
 *
 * There were sixteen, drawn from Tailwind's palette. Sixteen is more than a
 * student ever has subjects, and drawing them from a stock ramp meant several
 * sat close enough to the brand pink or gold to compete with a CTA. The six
 * here are derived instead: placed in the gaps between the four hues the brand
 * already occupies, each at least 28 degrees clear of the nearest, every one
 * over 4.5:1 with white text, and the closest pair 35 deltaE apart.
 *
 * Written as `bg-[var(--subject-N)]` rather than interpolated. Tailwind's JIT
 * scans this file as text, so a computed class name is never generated — the
 * colours would survive dev and vanish in production.
 *
 * The values themselves live in CSS so the dark theme can lift them without
 * this file knowing about themes at all.
 */
export const SUBJECT_HUES: Record<SubjectHueId, SubjectHue> = {
  mavi: {
    id: "mavi",
    card: "bg-[var(--subject-1)] text-white border-transparent",
    label: "text-white/90",
    dot: "bg-[var(--subject-1)]",
    chip: "bg-[var(--subject-1)] text-white",
  },
  lacivert: {
    id: "lacivert",
    card: "bg-[var(--subject-2)] text-white border-transparent",
    label: "text-white/90",
    dot: "bg-[var(--subject-2)]",
    chip: "bg-[var(--subject-2)] text-white",
  },
  erguvan: {
    id: "erguvan",
    card: "bg-[var(--subject-3)] text-white border-transparent",
    label: "text-white/90",
    dot: "bg-[var(--subject-3)]",
    chip: "bg-[var(--subject-3)] text-white",
  },
  zeytin: {
    id: "zeytin",
    card: "bg-[var(--subject-4)] text-white border-transparent",
    label: "text-white/90",
    dot: "bg-[var(--subject-4)]",
    chip: "bg-[var(--subject-4)] text-white",
  },
  turkuaz: {
    id: "turkuaz",
    card: "bg-[var(--subject-5)] text-white border-transparent",
    label: "text-white/90",
    dot: "bg-[var(--subject-5)]",
    chip: "bg-[var(--subject-5)] text-white",
  },
  grafit: {
    id: "grafit",
    card: "bg-[var(--subject-6)] text-white border-transparent",
    label: "text-white/90",
    dot: "bg-[var(--subject-6)]",
    chip: "bg-[var(--subject-6)] text-white",
  },
};

export const FALLBACK_HUE_RING: SubjectHueId[] = [
  "mavi",
  "lacivert",
  "erguvan",
  "zeytin",
  "turkuaz",
  "grafit",
];

/**
 * Turkish casing cannot go through toLowerCase() alone.
 *
 * "İNGİLİZCE".toLowerCase() yields "i" followed by U+0307 COMBINING DOT ABOVE,
 * which never equals "ingilizce" — the dotted capital would land on a different
 * hue from the lowercase spelling of the same subject. Folding first makes the
 * key spelling-proof. Dotless ı and dotted i collapse together on purpose: this
 * keys a colour, it is not a linguistic transform.
 */
const TURKISH_FOLD: Record<string, string> = {
  ı: "i",
  İ: "i",
  I: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ç: "c",
  Ç: "c",
  ö: "o",
  Ö: "o",
  ü: "u",
  Ü: "u",
};

/**
 * Normalised colour key for a subject name.
 *
 * Also strips the two qualifiers the catalogue actually uses, so variants of
 * one subject share a hue instead of scattering across the ring:
 *   "TYT Matematik" / "AYT Matematik" → matematik
 *   "Tarih-1" / "Tarih 2"             → tarih
 * Without this, "Tarih-1" hashes somewhere unrelated to "Tarih-2" and either
 * can collide with a curated subject's colour.
 */
export function subjectColorKey(name: string): string {
  const folded = Array.from(name.trim())
    .map((character) => TURKISH_FOLD[character] ?? character)
    .join("")
    .toLowerCase()
    .replace(/\s+/g, " ");

  return folded
    .replace(/^(tyt|ayt|ydt)\s+/, "")
    .replace(/[\s-]*\d+$/, "")
    .trim();
}

/**
 * Curated hues for the subjects a YKS student actually sees, so Matematik is
 * blue on every account rather than wherever the hash happens to land.
 * Keyed through subjectColorKey at module init — writing the folded keys out by
 * hand is how a stray "türkçe" silently stops matching.
 */
/*
 * Six colours across eighteen subjects means repeats, and where they land is a
 * choice rather than an accident: subjects a student is likely to hold in the
 * same week are kept apart, and the pairs that share a colour are ones that
 * rarely appear side by side (Matematik with Psikoloji, Fizik with Sosyoloji).
 * Grafit is the quiet one, so it takes the subjects that show up least.
 */
const CURATED_SUBJECT_SOURCE: [string, SubjectHueId][] = [
  ["Matematik", "mavi"],
  ["Geometri", "turkuaz"],
  ["Fizik", "lacivert"],
  ["Kimya", "turkuaz"],
  ["Biyoloji", "zeytin"],
  ["Türkçe", "erguvan"],
  ["Edebiyat", "erguvan"],
  ["Türk Dili ve Edebiyatı", "erguvan"],
  ["Tarih", "grafit"],
  ["Coğrafya", "zeytin"],
  ["Felsefe", "lacivert"],
  ["Din Kültürü", "grafit"],
  ["Din Kültürü ve Ahlak Bilgisi", "grafit"],
  ["İngilizce", "erguvan"],
  ["Sosyoloji", "lacivert"],
  ["Psikoloji", "mavi"],
  ["Mantık", "grafit"],
  ["Genel Yetenek", "zeytin"],
];

export const CURATED_SUBJECT_HUES: Record<string, SubjectHueId> = Object.fromEntries(
  CURATED_SUBJECT_SOURCE.map(([name, hue]) => [subjectColorKey(name), hue])
);

/**
 * FNV-1a. Pure string maths on purpose — the hue is computed during SSR and
 * again on the client, so anything involving Math.random or the clock would
 * hydrate to a different colour than it rendered.
 */
function hashKey(key: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** The hue for a subject name, or null when there is no subject to key on. */
export function subjectHue(name: string | null | undefined): SubjectHue | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const key = subjectColorKey(trimmed);
  if (!key) return null;

  const curated = CURATED_SUBJECT_HUES[key];
  if (curated) return SUBJECT_HUES[curated];

  return SUBJECT_HUES[FALLBACK_HUE_RING[hashKey(key) % FALLBACK_HUE_RING.length]];
}

/**
 * Dot and chip classes for a subject name, for surfaces outside the calendar.
 * ScheduleSubjectStat carries a subject *name* rather than an id, so keying on
 * the name is what lets the totals cards and the calendar agree by construction.
 */
export function subjectAccent(name: string | null | undefined): { dot: string; chip: string } {
  const hue = subjectHue(name);
  if (!hue) return { dot: "bg-brand-500", chip: "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200" };
  return { dot: hue.dot, chip: hue.chip };
}

/** Lesson colour for a subject-less booking. Pink, because a lesson is the
    product and pink is what the product is drawn in. */
const LESSON_TONE: ScheduleTone = {
  icon: GraduationCap,
  card: "bg-pink text-white border-transparent",
  dot: "bg-pink",
  label: "text-white/90",
  kindLabel: "Hocam Dersi",
};

const COACHING_TONE: ScheduleTone = {
  icon: Lock,
  card: "bg-[var(--subject-2)] text-white border-transparent",
  dot: "bg-[var(--subject-2)]",
  label: "text-white/90",
  kindLabel: "Koçluk Görüşmesi",
};

/**
 * A lesson keeps the graduation cap, the "Hocam Dersi" label and the lock no
 * matter which hue it draws — only the colour moves. Those three, plus the
 * missing checkbox, are what keep a lesson from reading as a block the student
 * typed in now that both are filled.
 */
export function lessonTone(subjectName: string | null | undefined): ScheduleTone {
  const hue = subjectHue(subjectName);
  if (!hue) return LESSON_TONE;
  return {
    icon: GraduationCap,
    kindLabel: "Hocam Dersi",
    card: hue.card,
    dot: hue.dot,
    label: hue.label,
  };
}

export function toneForEvent(event: ScheduleEvent): ScheduleTone {
  if (event.source === "coaching") return COACHING_TONE;
  if (event.source === "booking") return lessonTone(event.subject?.name);
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

/** Exported for the invariant test: personal blocks must stay solid-filled. */
export const STUDY_TONES_FOR_TEST = STUDY_TONES;
