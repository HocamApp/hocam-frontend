import type {
  CoachingProgram,
  CoachingProgramInput,
  CoachingProgramTask,
  CoachingProgramTaskInput,
  CoachingStudentRow,
} from "./coachingApi";
import { coachingShortDate } from "./coachingStudentOverview";
import { buildStudentProgram } from "./coachingStudentProgram";

/** What the server keeps: `CoachingProgram.title` 200, `CoachingProgramTask.title` 240, `.subject` 120, `.priority` 20. */
const PROGRAM_TITLE_MAX = 200;
const TASK_TITLE_MAX = 240;
const TASK_SUBJECT_MAX = 120;
const TASK_PRIORITY_MAX = 20;

/** The three a tutor picks from. The server keeps the word as text, so nothing else changes. */
export const PRIORITY_CHOICES = ["Yüksek", "Orta", "Düşük"] as const;

/**
 * The choices for a task whose priority is `current`. A task written before the
 * choice existed may carry free text ("acil"); it is offered as a fourth so
 * opening the task to fix its title does not quietly wipe it.
 */
export function priorityChoices(current: string): string[] {
  const value = current.trim();
  return value && !(PRIORITY_CHOICES as readonly string[]).includes(value)
    ? [...PRIORITY_CHOICES, value]
    : [...PRIORITY_CHOICES];
}

export interface TaskFormValues {
  title: string;
  subject: string;
  description: string;
  /** "YYYY-MM-DD", or "" for none. */
  due_date: string;
  /** One of the choices, or "" for none. */
  priority: string;
}

export const EMPTY_TASK_FORM: TaskFormValues = {
  title: "",
  subject: "",
  description: "",
  due_date: "",
  priority: "",
};

export function taskFormFrom(task: CoachingProgramTask): TaskFormValues {
  return {
    title: task.title,
    subject: task.subject,
    description: task.description,
    due_date: task.due_date ?? "",
    priority: task.priority ?? "",
  };
}

export function toTaskPayload(form: TaskFormValues): CoachingProgramTaskInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    subject: form.subject.trim(),
    due_date: form.due_date || null,
    priority: form.priority.trim() || null,
  };
}

/** The sentence for the first thing wrong with a task, or null when it can be sent. */
export function taskFormError(form: TaskFormValues): string | null {
  const title = form.title.trim();
  if (!title) return "Görev başlığını yaz.";
  if (title.length > TASK_TITLE_MAX) return `Görev başlığı en çok ${TASK_TITLE_MAX} karakter olabilir.`;
  if (form.subject.trim().length > TASK_SUBJECT_MAX) return `Ders adı en çok ${TASK_SUBJECT_MAX} karakter olabilir.`;
  if (form.priority.trim().length > TASK_PRIORITY_MAX) return `Öncelik en çok ${TASK_PRIORITY_MAX} karakter olabilir.`;
  return null;
}

export interface ProgramFormValues {
  title: string;
  objective: string;
  start_date: string;
  end_date: string;
}

export function toProgramPayload(form: ProgramFormValues): CoachingProgramInput {
  return {
    title: form.title.trim(),
    objective: form.objective.trim(),
    start_date: form.start_date || null,
    end_date: form.end_date || null,
  };
}

/** The first thing missing or wrong, in the order the form asks for it. */
export function programFormError(form: ProgramFormValues): string | null {
  const title = form.title.trim();
  if (!title) return "Program başlığını yaz.";
  if (title.length > PROGRAM_TITLE_MAX) return `Program başlığı en çok ${PROGRAM_TITLE_MAX} karakter olabilir.`;
  if (!form.start_date) return "Başlangıç tarihini seç.";
  if (!form.end_date) return "Bitiş tarihini seç.";
  if (form.end_date < form.start_date) return "Bitiş tarihi başlangıçtan önce olamaz.";
  if (!form.objective.trim()) return "Bu dönemin amacını yaz.";
  return null;
}

export interface TutorProgramRow {
  id: string;
  title: string;
  subject: string | null;
  priority: string | null;
  description: string | null;
  /** "Sal 20 Eki"; null for a task with no date. */
  dateLabel: string | null;
  overdue: boolean;
  /** "Öğrenci tamamladı · Pzt 19 Eki"; null for an open task. */
  completedLabel: string | null;
  /** The stored task, so an edit starts from what is saved and not from what is shown. */
  task: CoachingProgramTask;
}

export interface TutorProgramModel {
  title: string;
  /** "12 Eki – 20 Ara"; null when the program has no dates. */
  rangeLabel: string | null;
  objective: string;
  doneCount: number;
  total: number;
  overdueCount: number;
  /** 0 to 100, how much of the list the student has finished; null for an empty list. */
  percent: number | null;
  /** What is open (by date), then what is done (latest first): the order the student sees. */
  rows: TutorProgramRow[];
}

function doneLabel(studentLabel: string | null): string | null {
  if (studentLabel === null) return null;
  const rest = studentLabel.replace(/^Tamamlandı\s*/, "");
  return rest ? `Öğrenci tamamladı · ${rest}` : "Öğrenci tamamladı";
}

function rangeOf(start: string | null, end: string | null): string | null {
  const from = start ? coachingShortDate(start) : null;
  const to = end ? coachingShortDate(end) : null;
  if (from && to) return `${from} – ${to}`;
  return from ?? to;
}

/**
 * The tutor's page of one student's program, in the order and the words of the
 * student's own screen (`buildStudentProgram`), so the two never disagree about
 * what is late or what comes first. `now` is passed in; nothing here reads the clock.
 */
export function buildTutorProgram({ program, now }: { program: CoachingProgram; now: Date }): TutorProgramModel {
  const student = buildStudentProgram({ program, now });
  const tasks = new Map(program.tasks.map((task) => [task.id, task]));
  const rows = [...student.pending, ...student.completed].map(
    (row): TutorProgramRow => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      priority: row.priority,
      description: row.description,
      dateLabel: row.dateLabel,
      overdue: row.overdue,
      completedLabel: doneLabel(row.completedLabel),
      task: tasks.get(row.id) as CoachingProgramTask,
    })
  );
  const total = program.tasks.length;
  return {
    title: program.title,
    rangeLabel: rangeOf(program.start_date, program.end_date),
    objective: (program.objective ?? "").trim(),
    doneCount: student.completed.length,
    total,
    overdueCount: student.pending.filter((row) => row.overdue).length,
    percent: total === 0 ? null : Math.round((student.completed.length / total) * 100),
    rows,
  };
}

/** "Elif Yılmaz · Program"; the plain name until the student list is there or when it does not know this period. */
export function programPageTitle(students: CoachingStudentRow[] | undefined, servicePeriodId: string): string {
  const student = students?.find((row) => row.service_period_id === servicePeriodId);
  return student?.student_name ? `${student.student_name} · Program` : "Öğrenci programı";
}
