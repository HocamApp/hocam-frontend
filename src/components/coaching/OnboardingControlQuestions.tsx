"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CoachingControlQuestion, CoachingOnboardingState } from "@/lib/coachingApi";

export function OnboardingControlQuestions({
  questions,
  answers,
  onAnswer,
  pendingQuestionId,
}: {
  questions: CoachingControlQuestion[];
  answers: CoachingOnboardingState["control_question_answers"];
  onAnswer: (questionId: string, answer: string) => Promise<{ explanation: string }>;
  pendingQuestionId: string | null;
}) {
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const nextIndex = questions.findIndex((question) => answers[question.id]?.is_correct !== true);
  if (nextIndex < 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/70 shadow-none">
        <CardContent className="flex items-center gap-3 p-5 text-sm text-emerald-950">
          <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0" />
          <p><span className="font-semibold">Hızlı kontrol tamamlandı.</span> Sözleşme adımına geçebilirsin.</p>
        </CardContent>
      </Card>
    );
  }
  const activeIndex = nextIndex;
  const question = questions[activeIndex];

  if (!question) return null;

  const recorded = answers[question.id];
  const isCorrect = recorded?.is_correct === true;
  const isWrong = recorded?.is_correct === false;
  const explanation = explanations[question.id];
  const handleSelect = async (value: string) => {
    const result = await onAnswer(question.id, value);
    setExplanations((current) => ({ ...current, [question.id]: result.explanation }));
  };

  return (
    <Card className="overflow-hidden border-foreground/15 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b bg-muted/25 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hızlı kontrol</p>
            <p className="mt-1 text-sm text-muted-foreground">Kuralı doğru anladığından emin olalım.</p>
          </div>
          <span className="rounded-full border bg-background px-3 py-1 text-xs font-semibold tabular-nums">{activeIndex + 1} / {questions.length}</span>
        </div>
        <fieldset className="space-y-4 p-5 sm:p-6">
          <legend className="text-base font-semibold leading-6">{question.question}</legend>
          <div className="grid gap-2">
            {question.options.map((option) => {
              const selected = recorded?.answer === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
                    selected && isCorrect && "border-emerald-600 bg-emerald-50 text-emerald-950",
                    selected && isWrong && "border-amber-500 bg-amber-50 text-amber-950",
                    !selected && "hover:bg-muted/50"
                  )}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={selected}
                    disabled={pendingQuestionId === question.id}
                    onChange={() => handleSelect(option.value)}
                    className="h-4 w-4 accent-foreground"
                  />
                  <span>{option.label}</span>
                  {selected && isCorrect ? <CheckCircle2 aria-label="Doğru" className="ml-auto h-4 w-4 text-emerald-700" /> : null}
                </label>
              );
            })}
          </div>
          {isWrong ? (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
              <RotateCcw aria-hidden className="mt-1 h-4 w-4 shrink-0" />
              <p>{explanation || "İlgili açıklamayı yeniden gözden geçirip başka bir seçenek deneyebilirsin."}</p>
            </div>
          ) : null}
        </fieldset>
      </CardContent>
    </Card>
  );
}
