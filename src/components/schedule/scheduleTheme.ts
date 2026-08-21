import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Lock,
  PencilLine,
  type LucideIcon,
} from "lucide-react";

import type { ScheduleEvent, StudyBlockType } from "@/types";

/**
 * The visual language of the calendar.
 *
 * The one rule the product cares about: a real Hocam lesson must never look
 * like something the student typed in. Lessons and coaching are drawn as
 * outlined, tinted cards with a lock; personal study blocks are solid colour
 * with a checkbox. Colour alone is not the signal — the fill style, the lock
 * and the checkbox all carry it, so it survives colour-blindness and greyscale.
 *
 * Lessons are additionally tinted per subject (see SUBJECT_HUES) so a week of
 * Matematik and Felsefe does not read as one undifferentiated block. The hue
 * varies; the outlined-tinted *treatment* never does.
 */

export type ScheduleTone = {
  /** Small badge left of the category label. */
  icon: LucideIcon;
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
    card: "bg-sky-700 text-white border-transparent dark:bg-sky-800",
    dot: "bg-sky-500",
    label: "text-white/90",
    kindLabel: "Konu Anlatımı",
  },
  soru_cozumu: {
    icon: PencilLine,
    card: "bg-emerald-700 text-white border-transparent dark:bg-emerald-800",
    dot: "bg-emerald-500",
    label: "text-white/90",
    kindLabel: "Soru Çözümü",
  },
  deneme: {
    icon: ClipboardCheck,
    card: "bg-amber-700 text-white border-transparent dark:bg-amber-800",
    dot: "bg-amber-500",
    label: "text-white",
    kindLabel: "Deneme",
  },
  custom: {
    icon: PencilLine,
    card: "bg-slate-600 text-white border-transparent dark:bg-slate-700",
    dot: "bg-slate-500",
    label: "text-white/90",
    kindLabel: "Çalışma",
  },
};

export type SubjectHueId =
  | "blue"
  | "violet"
  | "teal"
  | "rose"
  | "orange"
  | "cyan"
  | "purple"
  | "green"
  | "fuchsia"
  | "amber"
  | "sky"
  | "pink"
  | "lime"
  | "stone"
  | "emerald"
  | "slate";

export type SubjectHue = {
  id: SubjectHueId;
  /** Outlined + tinted lesson surface. */
  card: string;
  /** Small kind-label text on that surface. */
  label: string;
  /** Decorative dot: month chips and subject totals. */
  dot: string;
  /** Soft icon chip for the subject totals cards. */
  chip: string;
  /**
   * Day-view body. A step darker than `card`, which is nearly white: at -50 a
   * two-hour block separates from the page by 1.04–1.10 and reads as an empty
   * outline rather than occupied time. -200 separates by 1.17–1.42 and still
   * leaves the -900 text at 6.8:1 or better.
   */
  dayCard: string;
};

/**
 * One shape, sixteen hues. Every entry is the same construction as
 * COACHING_TONE — a -50 tint, -900 body text, a -300 border, and the -950/50
 * over --card composite in dark mode — so the outlined family stays one family
 * and only the hue moves.
 *
 * Measured contrast across all sixteen (see scheduleTheme.test.ts, which keeps
 * these honest):
 *   light  body  -900 on -50   8.44 (lime) … 17.06 (slate)
 *   light  label -800 on -50   6.81 (green) … 14.52 (stone)
 *   dark   body  -100 on tint  12.79 (blue) … 16.93 (slate)
 *   dark   label -300 on tint   8.16 (indigo) … 12.49 (slate)
 *
 * The label is -800 rather than -700 deliberately: at 10px uppercase it is the
 * one string with no size headroom, and -700 drops green/lime/amber/orange to
 * ~4.8 — passing AA on paper with nothing left over. -800 puts the whole
 * palette above 6.8.
 *
 * Class names are written out in full. Tailwind's JIT scans this file as text,
 * so an interpolated `bg-${id}-50` produces classes that are never generated —
 * the colours would survive dev and vanish in production.
 *
 * Excluded on purpose: red (owned by --destructive), yellow (the one family
 * that cannot clear the label bar comfortably), indigo (coaching).
 */
export const SUBJECT_HUES: Record<SubjectHueId, SubjectHue> = {
  blue: {
    id: "blue",
    card: "bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-700",
    label: "text-blue-800 dark:text-blue-300",
    dot: "bg-blue-500",
    chip: "bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    dayCard: "bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700",
  },
  violet: {
    id: "violet",
    card: "bg-violet-50 text-violet-900 border-violet-300 dark:bg-violet-950/50 dark:text-violet-100 dark:border-violet-700",
    label: "text-violet-800 dark:text-violet-300",
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
    dayCard: "bg-violet-200 text-violet-900 border-violet-300 dark:bg-violet-900/40 dark:text-violet-100 dark:border-violet-700",
  },
  teal: {
    id: "teal",
    card: "bg-teal-50 text-teal-900 border-teal-300 dark:bg-teal-950/50 dark:text-teal-100 dark:border-teal-700",
    label: "text-teal-800 dark:text-teal-300",
    dot: "bg-teal-500",
    chip: "bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
    dayCard: "bg-teal-200 text-teal-900 border-teal-300 dark:bg-teal-900/40 dark:text-teal-100 dark:border-teal-700",
  },
  rose: {
    id: "rose",
    card: "bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/50 dark:text-rose-100 dark:border-rose-700",
    label: "text-rose-800 dark:text-rose-300",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    dayCard: "bg-rose-200 text-rose-900 border-rose-300 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-700",
  },
  orange: {
    id: "orange",
    card: "bg-orange-50 text-orange-900 border-orange-300 dark:bg-orange-950/50 dark:text-orange-100 dark:border-orange-700",
    label: "text-orange-800 dark:text-orange-300",
    dot: "bg-orange-500",
    chip: "bg-orange-50 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
    dayCard: "bg-orange-200 text-orange-900 border-orange-300 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-700",
  },
  cyan: {
    id: "cyan",
    card: "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-100 dark:border-cyan-700",
    label: "text-cyan-800 dark:text-cyan-300",
    dot: "bg-cyan-500",
    chip: "bg-cyan-50 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200",
    dayCard: "bg-cyan-200 text-cyan-900 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-100 dark:border-cyan-700",
  },
  purple: {
    id: "purple",
    card: "bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950/50 dark:text-purple-100 dark:border-purple-700",
    label: "text-purple-800 dark:text-purple-300",
    dot: "bg-purple-500",
    chip: "bg-purple-50 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
    dayCard: "bg-purple-200 text-purple-900 border-purple-300 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700",
  },
  green: {
    id: "green",
    card: "bg-green-50 text-green-900 border-green-300 dark:bg-green-950/50 dark:text-green-100 dark:border-green-700",
    label: "text-green-800 dark:text-green-300",
    dot: "bg-green-500",
    chip: "bg-green-50 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    dayCard: "bg-green-200 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-100 dark:border-green-700",
  },
  fuchsia: {
    id: "fuchsia",
    card: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-950/50 dark:text-fuchsia-100 dark:border-fuchsia-700",
    label: "text-fuchsia-800 dark:text-fuchsia-300",
    dot: "bg-fuchsia-500",
    chip: "bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200",
    dayCard: "bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-900/40 dark:text-fuchsia-100 dark:border-fuchsia-700",
  },
  amber: {
    id: "amber",
    card: "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-700",
    label: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    dayCard: "bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700",
  },
  sky: {
    id: "sky",
    card: "bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950/50 dark:text-sky-100 dark:border-sky-700",
    label: "text-sky-800 dark:text-sky-300",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    dayCard: "bg-sky-200 text-sky-900 border-sky-300 dark:bg-sky-900/40 dark:text-sky-100 dark:border-sky-700",
  },
  pink: {
    id: "pink",
    card: "bg-pink-50 text-pink-900 border-pink-300 dark:bg-pink-950/50 dark:text-pink-100 dark:border-pink-700",
    label: "text-pink-800 dark:text-pink-300",
    dot: "bg-pink-500",
    chip: "bg-pink-50 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200",
    dayCard: "bg-pink-200 text-pink-900 border-pink-300 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700",
  },
  lime: {
    id: "lime",
    card: "bg-lime-50 text-lime-900 border-lime-300 dark:bg-lime-950/50 dark:text-lime-100 dark:border-lime-700",
    label: "text-lime-800 dark:text-lime-300",
    dot: "bg-lime-500",
    chip: "bg-lime-50 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200",
    dayCard: "bg-lime-200 text-lime-900 border-lime-300 dark:bg-lime-900/40 dark:text-lime-100 dark:border-lime-700",
  },
  stone: {
    id: "stone",
    card: "bg-stone-50 text-stone-900 border-stone-300 dark:bg-stone-950/50 dark:text-stone-100 dark:border-stone-700",
    label: "text-stone-800 dark:text-stone-300",
    dot: "bg-stone-500",
    chip: "bg-stone-50 text-stone-800 dark:bg-stone-900/40 dark:text-stone-200",
    dayCard: "bg-stone-200 text-stone-900 border-stone-300 dark:bg-stone-900/40 dark:text-stone-100 dark:border-stone-700",
  },
  emerald: {
    id: "emerald",
    card: "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-700",
    label: "text-emerald-800 dark:text-emerald-300",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    dayCard: "bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-700",
  },
  slate: {
    id: "slate",
    card: "bg-slate-50 text-slate-900 border-slate-300 dark:bg-slate-950/50 dark:text-slate-100 dark:border-slate-700",
    label: "text-slate-800 dark:text-slate-300",
    dot: "bg-slate-500",
    chip: "bg-slate-50 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200",
    dayCard: "bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-900/40 dark:text-slate-100 dark:border-slate-700",
  },
};

/**
 * The ring the hash fallback walks for subjects that are not curated.
 *
 * The order is load-bearing: changing it re-colours every uncurated subject on
 * every student's calendar. A test pins it.
 */
export const FALLBACK_HUE_RING: SubjectHueId[] = [
  "blue",
  "violet",
  "teal",
  "rose",
  "orange",
  "cyan",
  "purple",
  "green",
  "fuchsia",
  "amber",
  "sky",
  "pink",
  "lime",
  "stone",
  "emerald",
  "slate",
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
const CURATED_SUBJECT_SOURCE: [string, SubjectHueId][] = [
  ["Matematik", "blue"],
  ["Geometri", "cyan"],
  ["Fizik", "violet"],
  ["Kimya", "teal"],
  ["Biyoloji", "green"],
  ["Türkçe", "rose"],
  ["Edebiyat", "fuchsia"],
  ["Türk Dili ve Edebiyatı", "fuchsia"],
  ["Tarih", "amber"],
  ["Coğrafya", "orange"],
  ["Felsefe", "purple"],
  ["Din Kültürü", "stone"],
  ["Din Kültürü ve Ahlak Bilgisi", "stone"],
  ["İngilizce", "pink"],
  ["Sosyoloji", "lime"],
  ["Psikoloji", "sky"],
  ["Mantık", "slate"],
  ["Genel Yetenek", "emerald"],
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

/**
 * Day-view surfaces.
 *
 * The week and month grids give every event the same height, so a saturated
 * fill costs the same ink whatever the duration. The day view does not: height
 * is proportional to time, so the -700 fill that reads as a neat chip at 40
 * minutes becomes a slab at two hours — the same paint over three times the
 * area. Visual weight is area times saturation, and only one of those is
 * supposed to mean anything.
 *
 * So the day view decouples them, the way the calendars that solved this
 * already do: the saturated colour lives in a fixed-width bar down the left
 * edge and the body is a pale tint. A four-hour block and a half-hour one then
 * carry the same amount of loud pixels.
 *
 * The rule this must not break is that a lesson never looks like something the
 * student typed in. Fill style stops carrying that here, so the lock, the
 * graduation cap and the checkbox do — which is where the real signal always
 * was; the comment at the top of this file lists the fill as one of three
 * carriers, not the only one.
 */
const STUDY_BLOCK_HUES: Record<StudyBlockType, SubjectHueId> = {
  konu_anlatim: "sky",
  soru_cozumu: "emerald",
  deneme: "amber",
  custom: "slate",
};

const COACHING_HUE: SubjectHue = {
  id: "violet",
  card: "bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-100 dark:border-indigo-800",
  label: "text-indigo-800 dark:text-indigo-300",
  dot: "bg-indigo-500",
  chip: "bg-indigo-50 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  dayCard: "bg-indigo-200 text-indigo-900 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-100 dark:border-indigo-700",
};

const BRAND_HUE: SubjectHue = {
  id: "rose",
  card: "bg-brand-50 text-brand-900 border-brand-200 dark:bg-brand-900/30 dark:text-brand-100 dark:border-brand-800",
  label: "text-brand-600 dark:text-brand-300",
  dot: "bg-brand-500",
  chip: "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200",
  dayCard: "bg-brand-200 text-brand-900 border-brand-300 dark:bg-brand-900/40 dark:text-brand-100 dark:border-brand-700",
};

/** The pale body (`card`) and saturated left bar (`dot`) for a day-view block. */
export function dayHueForEvent(event: ScheduleEvent): SubjectHue {
  if (event.source === "coaching") return COACHING_HUE;
  if (event.source === "booking") return subjectHue(event.subject?.name) ?? BRAND_HUE;
  return SUBJECT_HUES[STUDY_BLOCK_HUES[event.block_type ?? "custom"]];
}

/** Lesson colour for a subject-less booking — the brand tint, as before. */
const LESSON_TONE: ScheduleTone = {
  icon: GraduationCap,
  card: "bg-brand-50 text-brand-900 border-brand-300 dark:bg-brand-900/30 dark:text-brand-100 dark:border-brand-700",
  dot: "bg-brand-500",
  label: "text-brand-600 dark:text-brand-300",
  kindLabel: "Hocam Dersi",
};

const COACHING_TONE: ScheduleTone = {
  icon: Lock,
  card: "bg-indigo-50 text-indigo-900 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-100 dark:border-indigo-700",
  dot: "bg-indigo-500",
  label: "text-indigo-600 dark:text-indigo-300",
  kindLabel: "Koçluk Görüşmesi",
};

/**
 * A lesson keeps the graduation cap, the "Hocam Dersi" label and the lock no
 * matter which hue it draws — only the tint moves. There is no path here that
 * can hand a booking a solid fill, which is what keeps a lesson from ever
 * looking like a block the student typed in.
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
