"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Circle } from "lucide-react";
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
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: COACHING_FAZ6_QUERY_KEYS.program(program.service_period_id),
    }),
    onError: (error) => toast.error(extractCoachingErrorMessage(error)),
  });
  const tasks = [...program.tasks].sort((left, right) => left.sort_order - right.sort_order);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className={COACHING_SECTION_TITLE_CLASS}>{program.title}</CardTitle>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{program.objective}</p>
          {program.start_date || program.end_date ? (
            <p className="text-xs text-muted-foreground">
              {program.start_date ?? "Başlangıç"} — {program.end_date ?? "Bitiş"}
            </p>
          ) : null}
        </CardHeader>
      </Card>
      <Card>
        <CardHeader><CardTitle className={COACHING_SECTION_TITLE_CLASS}>Görevlerim</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {tasks.length ? tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 rounded-lg border p-3">
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0"
                aria-label={task.is_completed ? "Görevi tamamlanmadı olarak işaretle" : "Görevi tamamlandı olarak işaretle"}
                disabled={toggleMutation.isPending}
                onClick={() => toggleMutation.mutate(task.id)}
              >
                {task.is_completed ? <Check className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5" />}
              </Button>
              <div className="min-w-0">
                <p className={task.is_completed ? "font-medium line-through text-muted-foreground" : "font-medium"}>{task.title}</p>
                {task.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{task.description}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {[task.subject, task.due_date ? `Hedef: ${task.due_date}` : null, task.priority].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">Öğretmenin henüz görev eklemedi.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
