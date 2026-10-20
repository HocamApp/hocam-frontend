import type { CoachingProgram, CoachingProgramTask } from "./coachingApi";
import { istanbulDateKey } from "./coachingOverview";
import { coachingShortDate, dateParts, type StudentTimelineDate } from "./coachingStudentOverview";

const DAY_MS = 86_400_000;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}/;

export interface StudentProgramRow {
  id: string;
  title: string;
  subject: string | null;
  /** What the tutor typed, as typed. */
  priority: string | null;
  description: string | null;
  date: StudentTimelineDate | null;
  /** "Çar 21 Eki" */
  dateLabel: string | null;
  overdue: boolean;
  /** "Tamamlandı Per 16 Eki"; set on finished tasks only. */
  completedLabel: string | null;
}

export interface StudentProgramGoal {
  title: string;
  /** Empty when the tutor wrote none; the page then leads with the title. */
  objective: string;
  doneCount: number;
  total: number;
  /** The program's own span, with where today falls on it. Null when it has no dates at all. */
  timeline: {
    startLabel: string | null;
    endLabel: string | null;
    /** 0 to 100; null unless both ends are known. */
    elapsedPercent: number | null;
  } | null;
}

export interface StudentProgramModel {
  goal: StudentProgramGoal;
  pending: StudentProgramRow[];
  completed: StudentProgramRow[];
}

function dayKey(value: string | null): string | null {
  return value && DATE_KEY.test(value) ? value.slice(0, 10) : null;
}

/** Whole days since the epoch for a "YYYY-MM-DD" key, read as a calendar day. */
function dayNumber(key: string): number {
  return Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10))) / DAY_MS;
}

function shortWhen(key: string): string {
  const parts = dateParts(key);
  return `${parts.weekday} ${parts.day} ${parts.month}`;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

/**
 * The student's program page: the goal with how far the program and the task
 * list have come, what is left by date (the overdue one first just by being the
 * earliest, undated ones last, the tutor's own order breaking ties), and what is
 * done, latest first. Days are Istanbul days, whatever the browser's zone is.
 * `now` is passed in; nothing here reads the clock.
 */
export function buildStudentProgram({
  program,
  now,
}: {
  program: CoachingProgram;
  now: Date;
}): StudentProgramModel {
  const today = istanbulDateKey(now);

  const row = (task: CoachingProgramTask): StudentProgramRow => {
    const key = dayKey(task.due_date);
    const finishedKey = task.completed_at ? istanbulDateKey(Date.parse(task.completed_at)) : null;
    return {
      id: task.id,
      title: task.title,
      subject: clean(task.subject),
      priority: clean(task.priority),
      description: clean(task.description),
      date: key ? dateParts(key) : null,
      dateLabel: key ? shortWhen(key) : null,
      overdue: !task.is_completed && key !== null && key < today,
      completedLabel: task.is_completed ? (finishedKey ? `Tamamlandı ${shortWhen(finishedKey)}` : "Tamamlandı") : null,
    };
  };

  const byOrder = (a: CoachingProgramTask, b: CoachingProgramTask) =>
    a.sort_order - b.sort_order || a.id.localeCompare(b.id);

  const pending = program.tasks
    .filter((task) => !task.is_completed)
    .sort((a, b) => {
      const ka = dayKey(a.due_date);
      const kb = dayKey(b.due_date);
      if (ka && kb && ka !== kb) return ka < kb ? -1 : 1;
      if (ka && !kb) return -1;
      if (!ka && kb) return 1;
      return byOrder(a, b);
    })
    .map(row);

  const completed = program.tasks
    .filter((task) => task.is_completed)
    .sort((a, b) => {
      const ta = a.completed_at ? Date.parse(a.completed_at) : -Infinity;
      const tb = b.completed_at ? Date.parse(b.completed_at) : -Infinity;
      return ta === tb ? byOrder(a, b) : tb - ta;
    })
    .map(row);

  const start = dayKey(program.start_date);
  const end = dayKey(program.end_date);
  let timeline: StudentProgramGoal["timeline"] = null;
  if (start || end) {
    let elapsedPercent: number | null = null;
    if (start && end) {
      const span = dayNumber(end) - dayNumber(start);
      const passed = dayNumber(today) - dayNumber(start);
      elapsedPercent = span <= 0 ? (passed >= 0 ? 100 : 0) : Math.min(100, Math.max(0, Math.round((passed / span) * 100)));
    }
    timeline = {
      startLabel: start ? coachingShortDate(start) : null,
      endLabel: end ? coachingShortDate(end) : null,
      elapsedPercent,
    };
  }

  return {
    goal: {
      title: program.title,
      objective: (program.objective ?? "").trim(),
      doneCount: completed.length,
      total: program.tasks.length,
      timeline,
    },
    pending,
    completed,
  };
}
