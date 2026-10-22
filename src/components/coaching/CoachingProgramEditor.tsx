"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useServerNow } from "@/hooks/useServerNow";
import {
  COACHING_FAZ6_QUERY_KEYS,
  createCoachingProgramTask,
  deleteCoachingProgramTask,
  extractCoachingErrorMessage,
  fetchCoachingProgram,
  saveCoachingProgram,
  updateCoachingProgramTask,
} from "@/lib/coachingApi";
import { istanbulDateKey } from "@/lib/coachingOverview";
import {
  EMPTY_TASK_FORM,
  buildTutorProgram,
  taskFormFrom,
  toProgramPayload,
  toTaskPayload,
  type ProgramFormValues,
  type TaskFormValues,
} from "@/lib/coachingTutorProgram";
import { ProgramForm, ProgramSummary, TaskForm, TaskRowItem } from "./ProgramParts";

/**
 * A tutor's page of one student's program: the program on a white card (its
 * name, its span, its aim, how far the student has come), a form that adds a
 * task in one line, and the list in the order the student sees it. Tasks are
 * edited and deleted on their own row; a delete asks first, and says so when the
 * student had finished the task, because the record goes with it.
 *
 * Every write resolves to a sentence for the form it came from, so a refusal
 * shows next to what was typed and nothing typed is lost.
 */
export function CoachingProgramEditor({ servicePeriodId }: { servicePeriodId: string }) {
  const queryClient = useQueryClient();
  const key = COACHING_FAZ6_QUERY_KEYS.program(servicePeriodId);
  const now = useServerNow(60_000);
  const { data: program, isLoading, isError, error } = useQuery({
    queryKey: key,
    queryFn: () => fetchCoachingProgram(servicePeriodId),
  });
  const [editingProgram, setEditingProgram] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteFailure, setDeleteFailure] = useState<{ id: string; message: string } | null>(null);

  const model = useMemo(() => (program ? buildTutorProgram({ program, now }) : null), [program, now]);

  if (isLoading) return <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>;
  if (isError) return <ErrorMessage message={extractCoachingErrorMessage(error)} />;

  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const saveProgram = async (values: ProgramFormValues): Promise<string | null> => {
    try {
      await saveCoachingProgram(servicePeriodId, toProgramPayload(values));
      await refresh();
      setEditingProgram(false);
      toast.success("Program kaydedildi.");
      return null;
    } catch (failure) {
      return extractCoachingErrorMessage(failure);
    }
  };

  const addTask = async (values: TaskFormValues): Promise<string | null> => {
    try {
      await createCoachingProgramTask(program!.id, toTaskPayload(values));
      await refresh();
      return null;
    } catch (failure) {
      return extractCoachingErrorMessage(failure);
    }
  };

  const saveTask = (taskId: string) => async (values: TaskFormValues): Promise<string | null> => {
    try {
      await updateCoachingProgramTask(taskId, toTaskPayload(values));
      await refresh();
      setEditingTaskId(null);
      return null;
    } catch (failure) {
      return extractCoachingErrorMessage(failure);
    }
  };

  const removeTask = async (taskId: string) => {
    setDeletingId(taskId);
    setDeleteFailure(null);
    try {
      await deleteCoachingProgramTask(taskId);
      await refresh();
      setConfirmingId(null);
    } catch (failure) {
      setDeleteFailure({ id: taskId, message: extractCoachingErrorMessage(failure) });
    } finally {
      setDeletingId(null);
    }
  };

  const programValues = (): ProgramFormValues =>
    program
      ? {
          title: program.title,
          objective: program.objective ?? "",
          start_date: program.start_date ?? "",
          end_date: program.end_date ?? "",
        }
      : { title: "", objective: "", start_date: istanbulDateKey(now), end_date: "" };

  return (
    <div className="space-y-5">
      {!program ? (
        <ProgramForm
          heading="Programı oluştur"
          intro="Raporu yayınlayabilmek için bu dönemin bir programı olmalı. Başlığı, tarih aralığını ve amacı yaz; görevleri sonra eklersin."
          initial={programValues()}
          onSubmit={saveProgram}
        />
      ) : editingProgram ? (
        <ProgramForm
          heading="Programı düzenle"
          initial={programValues()}
          onSubmit={saveProgram}
          onCancel={() => setEditingProgram(false)}
        />
      ) : (
        <ProgramSummary model={model!} onEdit={() => setEditingProgram(true)} />
      )}

      {program && model ? (
        <>
          <section aria-labelledby="program-add-title" className="rounded-card border border-line bg-surface p-4 sm:p-5">
            <h2 id="program-add-title" className="mb-3 text-body font-bold text-ink">
              Görev ekle
            </h2>
            <TaskForm label="Yeni görev" initial={EMPTY_TASK_FORM} submitLabel="Ekle" onSubmit={addTask} startAgain />
          </section>

          <div className="rounded-card border border-line bg-surface px-4 sm:px-6">
            {model.rows.length === 0 ? (
              <EmptyState title="Henüz görev yok" description="Öğrencinin takip edebileceği küçük, net görevler ekle." />
            ) : (
              <ul aria-label="Görevler">
                {model.rows.map((row) => (
                  <TaskRowItem
                    key={row.id}
                    row={row}
                    mode={confirmingId === row.id ? "confirm-delete" : "view"}
                    deleting={deletingId === row.id}
                    deleteError={deleteFailure?.id === row.id ? deleteFailure.message : null}
                    onEdit={() => {
                      setConfirmingId(null);
                      setEditingTaskId(row.id);
                    }}
                    onAskDelete={() => {
                      setEditingTaskId(null);
                      setDeleteFailure(null);
                      setConfirmingId(row.id);
                    }}
                    onCancelDelete={() => {
                      setConfirmingId(null);
                      setDeleteFailure(null);
                    }}
                    onConfirmDelete={() => void removeTask(row.id)}
                    editForm={
                      editingTaskId === row.id ? (
                        <TaskForm
                          label="Görevi düzenle"
                          initial={taskFormFrom(row.task)}
                          submitLabel="İçeriği kaydet"
                          onSubmit={saveTask(row.id)}
                          onCancel={() => setEditingTaskId(null)}
                          autoFocus
                        />
                      ) : null
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
