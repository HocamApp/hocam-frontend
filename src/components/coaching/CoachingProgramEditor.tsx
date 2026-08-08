"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  COACHING_FAZ6_QUERY_KEYS,
  createCoachingProgramTask,
  deleteCoachingProgramTask,
  extractCoachingErrorMessage,
  fetchCoachingProgram,
  reorderCoachingProgramTasks,
  saveCoachingProgram,
  updateCoachingProgramTask,
  type CoachingProgramTask,
  type CoachingProgramTaskInput,
} from "@/lib/coachingApi";

type TaskForm = Required<Omit<CoachingProgramTaskInput, "due_date" | "priority">> & {
  due_date: string;
  priority: string;
};

const EMPTY_TASK: TaskForm = {
  title: "",
  description: "",
  subject: "",
  due_date: "",
  priority: "",
};

function taskForm(task: CoachingProgramTask): TaskForm {
  return {
    title: task.title,
    description: task.description,
    subject: task.subject,
    due_date: task.due_date ?? "",
    priority: task.priority ?? "",
  };
}

function toTaskPayload(form: TaskForm): CoachingProgramTaskInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    subject: form.subject.trim(),
    due_date: form.due_date || null,
    priority: form.priority.trim() || null,
  };
}

function TaskContentForm({
  initial,
  onSubmit,
  submitLabel,
  isPending,
  onCancel,
}: {
  initial: TaskForm;
  onSubmit: (form: TaskForm) => void;
  submitLabel: string;
  isPending: boolean;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState(initial);

  useEffect(() => setForm(initial), [initial]);

  const update = (field: keyof TaskForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <form
      className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <Input
        required
        value={form.title}
        onChange={(event) => update("title", event.target.value)}
        placeholder="Görev başlığı"
        aria-label="Görev başlığı"
      />
      <Input
        value={form.subject}
        onChange={(event) => update("subject", event.target.value)}
        placeholder="Ders (opsiyonel)"
        aria-label="Görev dersi"
      />
      <Textarea
        className="min-h-20 sm:col-span-2"
        value={form.description}
        onChange={(event) => update("description", event.target.value)}
        placeholder="Açıklama (opsiyonel)"
        aria-label="Görev açıklaması"
      />
      <Input
        type="date"
        value={form.due_date}
        onChange={(event) => update("due_date", event.target.value)}
        aria-label="Hedef tarih"
      />
      <Input
        value={form.priority}
        onChange={(event) => update("priority", event.target.value)}
        placeholder="Öncelik (opsiyonel)"
        aria-label="Görev önceliği"
      />
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={isPending}>
          <Save className="mr-1 h-4 w-4" /> {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Vazgeç
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function CoachingProgramEditor({ servicePeriodId }: { servicePeriodId: string }) {
  const queryClient = useQueryClient();
  const key = COACHING_FAZ6_QUERY_KEYS.program(servicePeriodId);
  const { data: program, isLoading, isError, error } = useQuery({
    queryKey: key,
    queryFn: () => fetchCoachingProgram(servicePeriodId),
  });
  const [programForm, setProgramForm] = useState({
    title: "",
    objective: "",
    start_date: "",
    end_date: "",
  });
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!program) return;
    setProgramForm({
      title: program.title,
      objective: program.objective,
      start_date: program.start_date ?? "",
      end_date: program.end_date ?? "",
    });
  }, [program]);

  const invalidateProgram = () => queryClient.invalidateQueries({ queryKey: key });
  const saveProgramMutation = useMutation({
    mutationFn: () =>
      saveCoachingProgram(servicePeriodId, {
        title: programForm.title.trim(),
        objective: programForm.objective.trim(),
        start_date: programForm.start_date || null,
        end_date: programForm.end_date || null,
      }),
    onSuccess: () => {
      toast.success("Çalışma programı kaydedildi.");
      invalidateProgram();
    },
    onError: (mutationError) => toast.error(extractCoachingErrorMessage(mutationError)),
  });
  const createTaskMutation = useMutation({
    mutationFn: (payload: CoachingProgramTaskInput) => createCoachingProgramTask(program!.id, payload),
    onSuccess: () => {
      setAddingTask(false);
      toast.success("Görev eklendi.");
      invalidateProgram();
    },
    onError: (mutationError) => toast.error(extractCoachingErrorMessage(mutationError)),
  });
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: CoachingProgramTaskInput }) =>
      updateCoachingProgramTask(taskId, payload),
    onSuccess: () => {
      setEditingTaskId(null);
      toast.success("Görev içeriği güncellendi.");
      invalidateProgram();
    },
    onError: (mutationError) => toast.error(extractCoachingErrorMessage(mutationError)),
  });
  const deleteTaskMutation = useMutation({
    mutationFn: deleteCoachingProgramTask,
    onSuccess: () => {
      toast.success("Görev silindi.");
      invalidateProgram();
    },
    onError: (mutationError) => toast.error(extractCoachingErrorMessage(mutationError)),
  });
  const reorderMutation = useMutation({
    mutationFn: (taskIds: string[]) => reorderCoachingProgramTasks(program!.id, taskIds),
    onSuccess: invalidateProgram,
    onError: (mutationError) => toast.error(extractCoachingErrorMessage(mutationError)),
  });
  const tasks = useMemo(
    () => [...(program?.tasks ?? [])].sort((left, right) => left.sort_order - right.sort_order),
    [program?.tasks]
  );

  if (isLoading) return <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>;
  if (isError) return <ErrorMessage message={extractCoachingErrorMessage(error)} />;

  const moveTask = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= tasks.length) return;
    const reordered = [...tasks];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    reorderMutation.mutate(reordered.map((task) => task.id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{program ? "Çalışma programı" : "Çalışma programı oluştur"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bu dönem için tek bir canlı program yönetirsin. Görev tamamlanmaları öğrencide kalır.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              saveProgramMutation.mutate();
            }}
          >
            <Input
              required
              value={programForm.title}
              onChange={(event) => setProgramForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Program başlığı"
              aria-label="Program başlığı"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input required type="date" value={programForm.start_date} aria-label="Başlangıç tarihi" onChange={(event) => setProgramForm((current) => ({ ...current, start_date: event.target.value }))} />
              <Input required type="date" value={programForm.end_date} aria-label="Bitiş tarihi" onChange={(event) => setProgramForm((current) => ({ ...current, end_date: event.target.value }))} />
            </div>
            <Textarea
              required
              className="min-h-28 sm:col-span-2"
              value={programForm.objective}
              onChange={(event) => setProgramForm((current) => ({ ...current, objective: event.target.value }))}
              placeholder="Bu dönemin amacı"
              aria-label="Program amacı"
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saveProgramMutation.isPending}>
                <Save className="mr-2 h-4 w-4" /> Programı kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {program ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 gap-3">
            <div>
              <CardTitle className="text-lg">Görevler</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">İçeriği sen düzenlersin; tamamlanma öğrencinindir.</p>
            </div>
            <Button size="sm" onClick={() => setAddingTask(true)}>
              <Plus className="mr-1 h-4 w-4" /> Görev ekle
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {addingTask ? (
              <TaskContentForm
                initial={EMPTY_TASK}
                onSubmit={(form) => createTaskMutation.mutate(toTaskPayload(form))}
                submitLabel="Görevi ekle"
                isPending={createTaskMutation.isPending}
                onCancel={() => setAddingTask(false)}
              />
            ) : null}
            {tasks.length === 0 && !addingTask ? (
              <EmptyState title="Henüz görev yok" description="Öğrencinin takip edebileceği küçük, net görevler ekle." />
            ) : null}
            {tasks.map((task, index) => (
              <div key={task.id} className="rounded-lg border p-3">
                {editingTaskId === task.id ? (
                  <TaskContentForm
                    initial={taskForm(task)}
                    onSubmit={(form) => updateTaskMutation.mutate({ taskId: task.id, payload: toTaskPayload(form) })}
                    submitLabel="İçeriği kaydet"
                    isPending={updateTaskMutation.isPending}
                    onCancel={() => setEditingTaskId(null)}
                  />
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{task.title}</p>
                      {task.subject ? <p className="mt-1 text-sm text-muted-foreground">{task.subject}</p> : null}
                      {task.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{task.description}</p> : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {task.due_date ? `Hedef: ${task.due_date}` : "Hedef tarih yok"}
                        {task.priority ? ` · ${task.priority}` : ""}
                        {task.is_completed ? " · Öğrenci tamamladı" : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" aria-label="Görevi yukarı taşı" disabled={index === 0 || reorderMutation.isPending} onClick={() => moveTask(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Görevi aşağı taşı" disabled={index === tasks.length - 1 || reorderMutation.isPending} onClick={() => moveTask(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Görevi düzenle" onClick={() => setEditingTaskId(task.id)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Görevi sil" disabled={deleteTaskMutation.isPending} onClick={() => deleteTaskMutation.mutate(task.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
