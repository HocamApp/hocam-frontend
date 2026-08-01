const EXAM_ORDER = ["TYT", "AYT", "YDT", "DGS", "KPSS"] as const;

type TutorSubjectLabelInput = {
  id: string;
  name: string;
  exam_type?: string | null;
};

export type TutorSubjectLabel = {
  key: string;
  label: string;
  exam: string | null;
};

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizedLabel(value: string): string {
  return collapseWhitespace(value).toLocaleLowerCase("tr-TR");
}

function examRank(exam: string | null): number {
  if (!exam) return EXAM_ORDER.length + 1;
  const index = EXAM_ORDER.indexOf(exam as (typeof EXAM_ORDER)[number]);
  return index === -1 ? EXAM_ORDER.length : index;
}

/** Builds the student-facing `[exam/level] + [subject]` chip content from
 * structured API fields, with a subject-only fallback and label-based
 * deduplication. */
export function buildTutorSubjectLabels(
  subjects: TutorSubjectLabelInput[]
): TutorSubjectLabel[] {
  const unique = new Map<string, TutorSubjectLabel>();

  for (const subject of subjects) {
    const name = collapseWhitespace(subject.name);
    if (!name) continue;
    const rawExam = collapseWhitespace(subject.exam_type ?? "");
    const exam = rawExam ? rawExam.toLocaleUpperCase("tr-TR") : null;
    const label = exam ? `${exam} ${name}` : name;
    const key = normalizedLabel(label);
    if (!unique.has(key)) unique.set(key, { key, label, exam });
  }

  return Array.from(unique.values()).sort(
    (left, right) =>
      examRank(left.exam) - examRank(right.exam) ||
      left.label.localeCompare(right.label, "tr-TR")
  );
}
