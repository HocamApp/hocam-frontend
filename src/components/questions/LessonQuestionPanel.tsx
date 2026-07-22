"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, FileQuestion, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchQuestions } from "@/lib/questionsApi";
import { QuestionViewer } from "@/components/questions/QuestionViewer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/types";
import type { LessonQuestionSessionController } from "./useLessonQuestionSession";

export function LessonQuestionPanel({
  booking,
  session,
  onClose,
}: {
  booking: Booking;
  session: LessonQuestionSessionController;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const isTutor = user?.role === "tutor";
  const available = useQuery({
    queryKey: ["lesson-question-options", booking.subject.id],
    queryFn: () => fetchQuestions({ subject: booking.subject.id, page_size: 24 }),
    enabled: isTutor,
  });
  const active = session.state?.active_question;

  return (
    <aside
      id="lesson-question-panel"
      className="absolute inset-0 z-20 flex min-h-0 flex-col border-l bg-background text-foreground md:static md:w-[420px] md:shrink-0"
    >
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <FileQuestion className="h-4 w-4 text-primary" /> Canlı soru
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} aria-label="Soru panelini kapat">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {session.stateIsLoading && <Skeleton className="h-72 rounded-xl" />}
        {session.stateIsError && !session.state ? (
          <div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p>Canlı soru durumu yüklenemedi.</p>
            <Button size="sm" variant="outline" onClick={session.refetchState}>
              Yeniden dene
            </Button>
          </div>
        ) : active ? (
          <>
            <QuestionViewer
              key={`${active.id}-${session.state?.version}`}
              question={active}
              compact
              answerControl="tutor-controlled"
              revealedCorrectChoice={session.state?.correct_choice}
              revealedSolutionUrl={session.state?.solution_url}
            />
            {isTutor && (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button
                  size="sm"
                  onClick={() => session.updateState({ solution_revealed: true })}
                  disabled={
                    Boolean(session.state?.solution_revealed) || session.updatePending
                  }
                >
                  <Eye className="mr-2 h-4 w-4" /> Cevabı öğrenciye göster
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={session.clearState}
                  disabled={session.clearPending}
                >
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
                onClick={() => session.updateState({ question_id: question.id })}
                disabled={session.updatePending}
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
