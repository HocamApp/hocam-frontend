"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileQuestion, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  clearLessonQuestionState,
  fetchLessonQuestionState,
  fetchQuestions,
  updateLessonQuestionState,
} from "@/lib/questionsApi";
import { QuestionViewer } from "@/components/questions/QuestionViewer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking, LessonQuestionStateUpdate } from "@/types";

export function LessonQuestionPanel({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isTutor = user?.role === "tutor";
  const state = useQuery({
    queryKey: ["lesson-question-state", booking.id],
    queryFn: () => fetchLessonQuestionState(booking.id),
    refetchInterval: 2_000,
  });
  const available = useQuery({
    queryKey: ["lesson-question-options", booking.subject.id],
    queryFn: () => fetchQuestions({ subject: booking.subject.id, page_size: 24 }),
    enabled: isTutor,
  });
  const update = useMutation({
    mutationFn: (payload: LessonQuestionStateUpdate) =>
      updateLessonQuestionState(booking.id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["lesson-question-state", booking.id], data);
    },
    onError: () => toast.error("Soru paylaşımı güncellenemedi."),
  });
  const clear = useMutation({
    mutationFn: () => clearLessonQuestionState(booking.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-question-state", booking.id] });
    },
    onError: () => toast.error("Paylaşım kapatılamadı."),
  });
  const active = state.data?.active_question;

  return (
    <aside className="absolute inset-0 z-20 flex min-h-0 flex-col border-l bg-background text-foreground md:static md:w-[420px] md:shrink-0">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <FileQuestion className="h-4 w-4 text-primary" /> Canlı soru
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} aria-label="Soru panelini kapat">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {state.isLoading && <Skeleton className="h-72 rounded-xl" />}
        {active ? (
          <>
            {isTutor && !state.data?.solution_revealed && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                Doğru cevap sadece sende görünüyor — öğrenci &quot;Cevabı öğrenciye göster&quot;e basana kadar bunu göremez.
              </p>
            )}
            <QuestionViewer
              key={`${active.id}-${state.data?.version}`}
              question={active}
              compact
              revealedCorrectChoice={state.data?.correct_choice}
              revealedSolutionUrl={state.data?.solution_url}
            />
            {isTutor && state.data?.student_attempt && (
              <p className="text-sm text-muted-foreground">
                Öğrenci cevabı:{" "}
                <span className="font-medium text-foreground">
                  {state.data.student_attempt.selected_choice || "—"}
                </span>
                {state.data.student_attempt.is_correct === true && " (doğru)"}
                {state.data.student_attempt.is_correct === false && " (yanlış)"}
              </p>
            )}
            {isTutor && (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button
                  size="sm"
                  onClick={() => update.mutate({ solution_revealed: true })}
                  disabled={Boolean(state.data?.solution_revealed) || update.isPending}
                >
                  <Eye className="mr-2 h-4 w-4" /> Cevabı öğrenciye göster
                </Button>
                <Button size="sm" variant="outline" onClick={() => clear.mutate()} disabled={clear.isPending}>
                  Paylaşımı kapat
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
            {isTutor
              ? "Aşağıdan bu dersin konusuna uygun bir soru seç."
              : "Hocan bir soru paylaştığında burada görünecek."}
          </div>
        )}

        {isTutor && (
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">{booking.subject.name} soruları</h3>
            {available.isLoading && <Skeleton className="h-32 rounded-xl" />}
            {available.data?.results.map((question) => (
              <button
                key={question.id}
                type="button"
                onClick={() => update.mutate({ question_id: question.id })}
                disabled={update.isPending}
                className="w-full rounded-xl border p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
              >
                <span className="line-clamp-3 whitespace-pre-wrap">{question.prompt}</span>
                <span className="mt-2 block text-xs text-muted-foreground">
                  {question.exam_type} {question.exam_year}
                  {question.topic ? ` · ${question.topic.title}` : ""}
                </span>
              </button>
            ))}
            {available.data && available.data.results.length === 0 && (
              <p className="text-sm text-muted-foreground">Bu ders için yayında soru yok.</p>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
