"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { InlineError } from "@/components/shared/InlineError";
import { ShakeOnError } from "@/components/shared/ShakeOnError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_TASK_FORM,
  priorityChoices,
  programFormError,
  taskFormError,
  type ProgramFormValues,
  type TaskFormValues,
  type TutorProgramModel,
  type TutorProgramRow,
} from "@/lib/coachingTutorProgram";

/**
 * The tutor's page of one student's program, in parts: the summary (or the form
 * that makes or edits it), the form that adds or edits a task, and a task's row.
 * What a form holds is its own once it is open: a program that is read again
 * from the server while a tutor is typing does not touch it.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */

const LINK =
  "inline-flex min-h-11 items-center text-small font-medium text-ink underline underline-offset-4 hover:text-pink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:text-ink-mid";
const CHIP =
  "inline-flex min-h-11 items-center rounded-pill border px-4 text-small font-medium transition-colors duration-[var(--duration-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";
const FIELD = "h-11 bg-surface text-body text-ink focus-visible:ring-0 focus-visible:ring-offset-0";

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-small font-medium text-ink">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** The card with the program's name, its span, what it is for and how far the student has come. */
export function ProgramSummary({ model, onEdit }: { model: TutorProgramModel; onEdit: () => void }) {
  return (
    <section aria-label="Program özeti" className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h2 className="text-small font-normal text-ink-mid">{model.title}</h2>
          {model.rangeLabel ? <p className="text-[1.0625rem] font-bold tabular-nums text-ink">{model.rangeLabel}</p> : null}
        </div>
        <div className="min-w-[10rem] flex-1 sm:max-w-xs">
          <p>
            <span className="text-[1.375rem] font-bold tabular-nums text-ink">{`${model.doneCount} / ${model.total}`}</span>{" "}
            <span className="text-small text-ink-mid">tamamlandı</span>
          </p>
          {model.overdueCount > 0 ? (
            <p className="text-small font-medium text-error tabular-nums">{`${model.overdueCount} gecikti`}</p>
          ) : null}
          {model.percent !== null ? (
            <div
              role="progressbar"
              aria-label="Görevlerin ne kadarı tamamlandı"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={model.percent}
              className="mt-2 h-1.5 w-full rounded-pill bg-line"
            >
              <div className="h-full rounded-pill bg-pink" style={{ width: `${model.percent}%` }} />
            </div>
          ) : null}
        </div>
      </div>

      {model.objective ? (
        <div className="mt-4">
          <p className="text-label text-ink-mid">Amaç</p>
          <p className="whitespace-pre-wrap text-small leading-[1.5] text-ink">{model.objective}</p>
        </div>
      ) : null}

      <div className="mt-2">
        <button type="button" className={LINK} onClick={onEdit}>
          Programı ve amacı düzenle
        </button>
      </div>
    </section>
  );
}

/** Makes the program, or changes it. Resolves to a sentence when the server said no, and null when it is saved. */
export function ProgramForm({
  heading,
  intro,
  initial,
  onSubmit,
  onCancel,
}: {
  heading: string;
  intro?: string;
  initial: ProgramFormValues;
  onSubmit: (values: ProgramFormValues) => Promise<string | null>;
  onCancel?: () => void;
}) {
  const ids = { title: useId(), start: useId(), end: useId(), objective: useId() };
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [shakes, setShakes] = useState(0);
  const [busy, setBusy] = useState(false);
  const set = (field: keyof ProgramFormValues) => (value: string) => setValues((current) => ({ ...current, [field]: value }));

  const fail = (message: string) => {
    setError(message);
    setShakes((count) => count + 1);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problem = programFormError(values);
    if (problem) return fail(problem);
    setError(null);
    setBusy(true);
    const failure = await onSubmit(values);
    setBusy(false);
    if (failure) fail(failure);
  };

  return (
    <section aria-labelledby={`${ids.title}-heading`} className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <h2 id={`${ids.title}-heading`} className="text-body font-bold text-ink">
        {heading}
      </h2>
      {intro ? <p className="mt-1 max-w-xl text-small text-ink-mid">{intro}</p> : null}
      <ShakeOnError trigger={shakes}>
        <form noValidate onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Program başlığı" id={ids.title}>
              <Input id={ids.title} className={FIELD} value={values.title} onChange={(event) => set("title")(event.target.value)} />
            </Field>
          </div>
          <Field label="Başlangıç tarihi" id={ids.start}>
            <Input id={ids.start} type="date" className={FIELD} value={values.start_date} onChange={(event) => set("start_date")(event.target.value)} />
          </Field>
          <Field label="Bitiş tarihi" id={ids.end}>
            <Input id={ids.end} type="date" className={FIELD} value={values.end_date} onChange={(event) => set("end_date")(event.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Bu dönemin amacı" id={ids.objective}>
              <Textarea
                id={ids.objective}
                rows={4}
                className="min-h-[7rem] bg-surface text-body text-ink focus-visible:border-ink focus-visible:ring-0 focus-visible:ring-offset-0"
                value={values.objective}
                onChange={(event) => set("objective")(event.target.value)}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <InlineError message={error} size="sm" className="mb-3" />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Button type="submit" size="sm" variant="gold" className="min-h-11" disabled={busy}>
                Programı kaydet
              </Button>
              {onCancel ? (
                <button type="button" className={LINK} onClick={onCancel} disabled={busy}>
                  Vazgeç
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </ShakeOnError>
    </section>
  );
}

/** Low, normal, high: tapping the chosen one takes it back, since a priority is optional. */
function PriorityPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const labelId = useId();
  return (
    <div className="min-w-0">
      <span id={labelId} className="block text-small font-medium text-ink">
        Öncelik
      </span>
      <div role="group" aria-labelledby={labelId} className="mt-1 flex flex-wrap gap-2">
        {priorityChoices(value).map((choice) => {
          const chosen = value === choice;
          return (
            <button
              key={choice}
              type="button"
              aria-pressed={chosen}
              onClick={() => onChange(chosen ? "" : choice)}
              className={`${CHIP} ${chosen ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink hover:border-ink"}`}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One task: the title, the subject, a date, a priority, and (when asked for) a
 * description. `onSubmit` resolves to a sentence when the server said no, and to
 * null when it is saved; after a save a form that adds starts again, with the
 * cursor on the title, so the next task can be typed straight away.
 */
export function TaskForm({
  label,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  startAgain = false,
  autoFocus = false,
}: {
  label: string;
  initial: TaskFormValues;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<string | null>;
  onCancel?: () => void;
  startAgain?: boolean;
  autoFocus?: boolean;
}) {
  const ids = { title: useId(), subject: useId(), date: useId(), description: useId() };
  const titleRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState(initial);
  const [describing, setDescribing] = useState(initial.description !== "");
  const [error, setError] = useState<string | null>(null);
  const [shakes, setShakes] = useState(0);
  const [busy, setBusy] = useState(false);
  const set = (field: keyof TaskFormValues) => (value: string) => setValues((current) => ({ ...current, [field]: value }));

  const fail = (message: string) => {
    setError(message);
    setShakes((count) => count + 1);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problem = taskFormError(values);
    if (problem) return fail(problem);
    setError(null);
    setBusy(true);
    const failure = await onSubmit(values);
    setBusy(false);
    if (failure) return fail(failure);
    if (startAgain) {
      setValues(EMPTY_TASK_FORM);
      setDescribing(false);
      titleRef.current?.focus();
    }
  };

  return (
    <ShakeOnError trigger={shakes}>
      <form aria-label={label} noValidate onSubmit={submit} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Field label="Görev" id={ids.title}>
            <Input
              id={ids.title}
              ref={titleRef}
              autoFocus={autoFocus}
              className={FIELD}
              value={values.title}
              onChange={(event) => set("title")(event.target.value)}
            />
          </Field>
          <Field label="Ders (isteğe bağlı)" id={ids.subject}>
            <Input id={ids.subject} className={FIELD} value={values.subject} onChange={(event) => set("subject")(event.target.value)} />
          </Field>
        </div>

        {describing ? (
          <Field label="Açıklama" id={ids.description}>
            <Textarea
              id={ids.description}
              rows={3}
              className="min-h-[5rem] bg-surface text-body text-ink focus-visible:border-ink focus-visible:ring-0 focus-visible:ring-offset-0"
              value={values.description}
              onChange={(event) => set("description")(event.target.value)}
            />
          </Field>
        ) : null}

        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div className="w-full min-[480px]:w-44">
            <Field label="Hedef tarih" id={ids.date}>
              <Input id={ids.date} type="date" className={FIELD} value={values.due_date} onChange={(event) => set("due_date")(event.target.value)} />
            </Field>
          </div>
          <PriorityPicker value={values.priority} onChange={set("priority")} />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 min-[900px]:ml-auto">
            {describing ? null : (
              <button type="button" className={LINK} onClick={() => setDescribing(true)}>
                Açıklama ekle
              </button>
            )}
            {onCancel ? (
              <button type="button" className={LINK} onClick={onCancel} disabled={busy}>
                Vazgeç
              </button>
            ) : null}
            <Button type="submit" size="sm" variant="gold" className="min-h-11" disabled={busy}>
              {submitLabel}
            </Button>
          </div>
        </div>
        <InlineError message={error} size="sm" />
      </form>
    </ShakeOnError>
  );
}

/** One task on the list: what it is, when it is due or who finished it, and what can be done to it. */
export function TaskRowItem({
  row,
  mode,
  deleteError,
  deleting,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  editForm,
}: {
  row: TutorProgramRow;
  mode: "view" | "confirm-delete";
  deleteError: string | null;
  deleting: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  /** The form that replaces the row while it is being edited; null for a row that is shown. */
  editForm: ReactNode | null;
}) {
  const done = row.task.is_completed;
  const meta = [row.subject, row.priority ? `Öncelik: ${row.priority}` : null].filter(Boolean).join(" · ");

  if (editForm) {
    return <li className="border-t border-line py-4 first:border-t-0">{editForm}</li>;
  }

  return (
    <li className="border-t border-line py-4 first:border-t-0">
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 min-[480px]:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h3 className={`text-body font-medium ${done ? "text-ink-mid" : "text-ink"}`}>{row.title}</h3>
          {meta ? <p className="text-small text-ink-mid">{meta}</p> : null}
          {row.description ? <p className="mt-1 whitespace-pre-wrap text-small leading-[1.5] text-ink">{row.description}</p> : null}
          {done ? (
            row.completedLabel ? <p className="mt-1 text-small tabular-nums text-ink-mid">{row.completedLabel}</p> : null
          ) : row.overdue ? (
            <p className="mt-1 text-small font-medium tabular-nums text-error">{`Gecikti · ${row.dateLabel}`}</p>
          ) : row.dateLabel ? (
            <p className="mt-1 text-small tabular-nums">
              <span className="text-ink-mid">Hedef · </span>
              <span className="font-medium text-ink">{row.dateLabel}</span>
            </p>
          ) : (
            <p className="mt-1 text-small text-ink-mid">Tarihi yok</p>
          )}
        </div>
        {mode === "view" ? (
          <div className="flex items-center gap-x-4 min-[480px]:justify-end">
            <button type="button" className={LINK} aria-label={`${row.title} görevini düzenle`} onClick={onEdit}>
              Düzenle
            </button>
            <button type="button" className={LINK} aria-label={`${row.title} görevini sil`} onClick={onAskDelete}>
              Sil
            </button>
          </div>
        ) : null}
      </div>

      {mode === "confirm-delete" ? (
        <div className="mt-2">
          <p className="text-small font-medium text-danger">Silinsin mi?</p>
          {done ? <p className="text-small text-ink-mid">Öğrenci bunu tamamlamıştı; silersen kaydı da kalkar.</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Button type="button" size="sm" variant="destructive" className="min-h-11" disabled={deleting} onClick={onConfirmDelete}>
              Evet, sil
            </Button>
            <button type="button" className={LINK} disabled={deleting} onClick={onCancelDelete}>
              Vazgeç
            </button>
          </div>
        </div>
      ) : null}
      <InlineError message={deleteError} size="sm" className="mt-2" />
    </li>
  );
}
