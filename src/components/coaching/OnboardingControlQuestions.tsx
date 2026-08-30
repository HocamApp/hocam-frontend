"use client";

import { useState } from "react";
import {
  ArrowCounterClockwise,
  CheckCircle,
  ShieldCheck,
} from "@phosphor-icons/react";

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
      <Card className="overflow-hidden rounded-card border-success bg-success-soft shadow-none">
        <CardContent className="flex items-center gap-4 p-5 text-sm text-ink sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input bg-surface text-success"><CheckCircle aria-hidden className="h-5 w-5" weight="fill" /></span>
          <div><p className="font-bold">Hızlı kontrol tamamlandı.</p><p className="mt-1 text-ink-mid">Sözleşme adımına geçebilirsin.</p></div>
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
    <Card className="overflow-hidden rounded-card border-line bg-surface shadow-none">
      <CardContent className="p-0">
        <div className="border-b border-line bg-paper px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-input bg-gold text-gold-ink"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-bold text-ink">Hızlı kontrol</p>
                <p className="mt-1 text-sm text-ink-mid">Kuralı doğru anladığından emin olalım.</p>
              </div>
            </div>
            <span className="text-xs font-semibold tabular-nums">{activeIndex + 1} / {questions.length}</span>
          </div>
          <div role="progressbar" aria-label="Hızlı kontrol ilerlemesi" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={activeIndex + 1} className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-pink transition-[width] motion-reduce:transition-none" style={{ width: `${((activeIndex + 1) / questions.length) * 100}%` }} />
          </div>
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
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-input border border-line bg-surface p-3 text-sm text-ink transition-colors duration-state",
                    selected && isCorrect && "border-success bg-success-soft",
                    selected && isWrong && "border-error bg-paper text-error",
                    !selected && "hover:bg-paper"
                  )}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={selected}
                    disabled={pendingQuestionId === question.id}
                    onChange={() => handleSelect(option.value)}
                    className="h-4 w-4 accent-pink"
                  />
                  <span>{option.label}</span>
                  {selected && isCorrect ? <CheckCircle aria-label="Doğru" className="ml-auto h-4 w-4 text-success" weight="fill" /> : null}
                </label>
              );
            })}
          </div>
          {isWrong ? (
            <div className="flex gap-3 rounded-input border border-error bg-paper p-4 text-sm leading-6 text-error" role="status">
              <ArrowCounterClockwise aria-hidden className="mt-1 h-4 w-4 shrink-0" />
              <p>{explanation || "İlgili açıklamayı yeniden gözden geçirip başka bir seçenek deneyebilirsin."}</p>
            </div>
          ) : null}
        </fieldset>
      </CardContent>
    </Card>
  );
}
