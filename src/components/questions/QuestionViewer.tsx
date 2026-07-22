"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { revealQuestion, submitQuestionAttempt } from "@/lib/questionsApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuestionAttemptResult, SolvableQuestion } from "@/types";

export function QuestionViewer({
  question,
  compact = false,
  revealedCorrectChoice = "",
  revealedSolutionUrl = "",
}: {
  question: SolvableQuestion;
  compact?: boolean;
  revealedCorrectChoice?: string;
  revealedSolutionUrl?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChoice, setSelectedChoice] = useState("");
  const [result, setResult] = useState<QuestionAttemptResult | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (user?.role === "student") {
        return submitQuestionAttempt(question.id, selectedChoice);
      }
      return revealQuestion(question.id);
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["wrong-questions"] });
      if (data.is_correct === true) toast.success("Doğru cevap!");
      if (data.is_correct === false) toast.info("Bu soru tekrar havuzuna eklendi.");
    },
    onError: () => toast.error("Yanıt işlenemedi. Lütfen tekrar dene."),
  });

  const correctChoice = result?.correct_choice || revealedCorrectChoice;
  const solutionUrl = result?.solution_url || revealedSolutionUrl;
  const isRevealed = Boolean(correctChoice);

  return (
    <article className={cn("space-y-5", compact ? "text-sm" : "rounded-2xl border bg-card p-5 sm:p-7")}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{question.exam_type} {question.exam_year}</Badge>
        {question.subject && <Badge variant="outline">{question.subject.name}</Badge>}
        {question.topic && <Badge variant="outline">{question.topic.title}</Badge>}
        {question.original_question_number && (
          <span className="text-xs text-muted-foreground">
            Soru {question.original_question_number}
          </span>
        )}
      </div>

      {question.question_image_url && (
        // Signed URLs cannot be known at build time; the backend constrains uploads to images.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.question_image_url}
          alt="Soru görseli"
          className="max-h-[620px] w-full rounded-xl border object-contain"
        />
      )}
      <p className={cn("whitespace-pre-wrap leading-7", compact ? "text-sm" : "text-base sm:text-lg")}>
        {question.prompt}
      </p>

      <div className="grid gap-2">
        {question.choices.map((choice) => {
          const selected = selectedChoice === choice.key;
          const correct = isRevealed && choice.key === correctChoice;
          const wrongSelected = isRevealed && selected && !correct;
          return (
            <button
              key={choice.key}
              type="button"
              disabled={isRevealed || user?.role !== "student"}
              onClick={() => setSelectedChoice(choice.key)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                selected && !isRevealed && "border-primary bg-primary/5",
                correct && "border-emerald-500 bg-emerald-500/10",
                wrongSelected && "border-red-500 bg-red-500/10",
                !selected && !isRevealed && user?.role === "student" && "hover:bg-muted/60"
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                {choice.key}
              </span>
              <span className="pt-1">{choice.text || "Görsel seçenek"}</span>
              {choice.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={choice.image_url} alt={`${choice.key} seçeneği`} className="max-h-32" />
              )}
              {correct && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />}
              {wrongSelected && <XCircle className="ml-auto h-5 w-5 text-red-600" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {user?.role === "student" && !isRevealed && (
          <Button
            onClick={() => mutation.mutate()}
            disabled={!selectedChoice || mutation.isPending}
          >
            Yanıtı kontrol et
          </Button>
        )}
        {user?.role !== "student" && !isRevealed && (
          <Button
            variant="outline"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Çözümü göster
          </Button>
        )}
        {isRevealed && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedChoice("");
              setResult(null);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Tekrar dene
          </Button>
        )}
        {solutionUrl && (
          <Button asChild variant="outline">
            <a href={solutionUrl} target="_blank" rel="noreferrer">
              MEBİ çözümünü aç <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      {isRevealed && result?.answer && (
        <div className="rounded-xl bg-muted p-4 text-sm">
          <span className="font-medium">Doğru cevap:</span> {result.answer}
        </div>
      )}
      <p className="border-t pt-3 text-xs text-muted-foreground">
        Kaynak: {question.attribution}. İçerik izin ve kaynak gösterme koşullarına tabidir.
      </p>
    </article>
  );
}
