"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COACHING_SECTION_TITLE_CLASS } from "@/components/coaching/CoachingSectionHeading";
import {
  COACHING_FAZ6_QUERY_KEYS,
  extractCoachingErrorMessage,
  toggleCoachingProgramTaskCompletion,
  type CoachingProgram,
} from "@/lib/coachingApi";

export function StudentProgramTasks({ program }: { program: CoachingProgram }) {
  const queryClient = useQueryClient();
  const toggleMutation = useMutation({
    mutationFn: toggleCoachingProgramTaskCompletion,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: COACHING_FAZ6_QUERY_KEYS.program(program.service_period_id),
      }),
    onError: (error) => toast.error(extractCoachingErrorMessage(error)),
  });
  const tasks = [...program.tasks].sort(
    (left, right) => left.sort_order - right.sort_order,
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className={COACHING_SECTION_TITLE_CLASS}>
            {program.title}
          </CardTitle>
          <p className="whitespace-pre-wrap text-body leading-[1.6] text-ink-mid">
            {program.objective}
          </p>
          {program.start_date || program.end_date ? (
            <p className="text-small text-ink-mid tabular-nums">
              Başlangıç: {program.start_date ?? "Belirlenmedi"} · Bitiş:{" "}
              {program.end_date ?? "Belirlenmedi"}
            </p>
          ) : null}
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className={COACHING_SECTION_TITLE_CLASS}>
            Görevlerim
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length ? (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-input border border-line p-4 sm:flex-row sm:items-start"
              >
                <Button
                  size="sm"
                  variant={task.is_completed ? "secondary" : "outline"}
                  className="shrink-0"
                  aria-label={
                    task.is_completed
                      ? "Görevi tamamlanmadı olarak işaretle"
                      : "Görevi tamamlandı olarak işaretle"
                  }
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate(task.id)}
                >
                  {task.is_completed ? (
                    <CheckCircle
                      className="mr-2 h-5 w-5 text-success"
                      weight="fill"
                    />
                  ) : (
                    <Circle className="mr-2 h-5 w-5" weight="regular" />
                  )}
                  {task.is_completed ? "Tamamlandı" : "Tamamla"}
                </Button>
                <div className="min-w-0">
                  <p
                    className={
                      task.is_completed
                        ? "text-body font-medium line-through text-ink-mid"
                        : "text-body font-medium text-ink"
                    }
                  >
                    {task.title}
                  </p>
                  {task.description ? (
                    <p className="mt-1 whitespace-pre-wrap text-small leading-[1.5] text-ink-mid">
                      {task.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-small text-ink-mid tabular-nums">
                    {[
                      task.subject,
                      task.due_date ? `Hedef: ${task.due_date}` : null,
                      task.priority,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-body text-ink-mid">
              Öğretmenin henüz görev eklemedi.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
