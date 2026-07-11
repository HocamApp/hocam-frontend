import type { ExamType, Subject } from "@/types";

export const EXAM_ORDER = ["TYT", "AYT", "YDT", "DGS", "KPSS"] as const satisfies readonly ExamType[];

const UNSUPPORTED_SUBJECT_NAMES = new Set(["arapça", "arabic"]);

export function isExamType(value?: string | null): value is ExamType {
  return EXAM_ORDER.includes(value as ExamType);
}

export function isSupportedSubject(subject: Subject): boolean {
  return !UNSUPPORTED_SUBJECT_NAMES.has(subject.name.trim().toLocaleLowerCase("tr-TR"));
}

export function getVisibleSubjects(subjects: Subject[]): Subject[] {
  return subjects.filter(isSupportedSubject);
}

export function getSubjectOptionsForExam(
  subjects: Subject[],
  examType?: string
): Subject[] {
  const visibleSubjects = getVisibleSubjects(subjects);
  const scopedSubjects = isExamType(examType)
    ? visibleSubjects.filter((subject) => subject.exam_type === examType)
    : visibleSubjects;

  return Array.from(new Map(scopedSubjects.map((subject) => [subject.name, subject])).values());
}

export function isSubjectValidForExam(
  subjects: Subject[],
  subjectName?: string,
  examType?: string
): boolean {
  if (!subjectName) return true;
  return getSubjectOptionsForExam(subjects, examType).some(
    (subject) => subject.name === subjectName
  );
}

export function groupSubjectsByExam(subjects: Subject[]) {
  const visibleSubjects = getVisibleSubjects(subjects);
  return EXAM_ORDER.map((exam) => ({
    exam,
    items: visibleSubjects.filter((subject) => subject.exam_type === exam),
  })).filter((group) => group.items.length > 0);
}

export function filterSelectedSubjectIds(subjects: Subject[], selectedIds: string[]): string[] {
  const allowedIds = new Set(getVisibleSubjects(subjects).map((subject) => subject.id));
  return selectedIds.filter((id) => allowedIds.has(id));
}
