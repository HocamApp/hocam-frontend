"use client";

import { useState } from "react";
import { ArrowCounterClockwise, CheckCircle } from "@phosphor-icons/react";

import type { CoachingControlQuestion, CoachingOnboardingState } from "@/lib/coachingApi";
import { controlProgress } from "@/lib/coachingOnboarding";

/**
 * One question of the quick check at a time: the first one the server has not
 * confirmed as correct. The server grades; a wrong answer shows its explanation
 * and can be answered again. The bar shows how many are confirmed, not which
 * question the tutor is looking at.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */
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
      <section className="flex items-center gap-4 rounded-card border border-success bg-surface p-5 sm:p-6">
        <CheckCircle aria-hidden className="h-8 w-8 shrink-0 text-success" weight="fill" />
        <div>
          <p className="text-body font-bold text-ink">Hızlı kontrol tamamlandı.</p>
          <p className="text-small text-ink-mid">Sözleşme adımına geçebilirsin.</p>
        </div>
      </section>
    );
  }
  const question = questions[nextIndex];
  if (!question) return null;

  const progress = controlProgress(questions, answers);
  const recorded = answers[question.id];
  const isWrong = recorded?.is_correct === false;
  const explanation = explanations[question.id];
  const handleSelect = async (value: string) => {
    const result = await onAnswer(question.id, value);
    setExplanations((current) => ({ ...current, [question.id]: result.explanation }));
  };

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-body font-bold text-ink">Hızlı kontrol</h2>
          <span className="text-small tabular-nums text-ink-mid">{`Soru ${nextIndex + 1} / ${questions.length}`}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Hızlı kontrol ilerlemesi"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={progress.correct}
          className="mt-3 h-1.5 overflow-hidden rounded-pill bg-line"
        >
          <div
            className="h-full rounded-pill bg-pink transition-[width] motion-reduce:transition-none"
            style={{ width: `${(progress.correct / questions.length) * 100}%` }}
          />
        </div>
      </div>
      <fieldset className="space-y-4 p-5 sm:p-6">
        <legend className="text-body font-medium leading-6 text-ink">{question.question}</legend>
        <div className="grid gap-2">
          {question.options.map((option) => {
            const selected = recorded?.answer === option.value;
            return (
              <label
                key={option.value}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-input border bg-surface p-3 text-small text-ink transition-colors duration-[var(--duration-state)] ${
                  selected && isWrong ? "border-error text-error" : selected ? "border-ink" : "border-line hover:border-ink"
                }`}
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
              </label>
            );
          })}
        </div>
        {isWrong ? (
          <div className="flex gap-3 rounded-input border border-error bg-paper p-4 text-small leading-6 text-error" role="status">
            <ArrowCounterClockwise aria-hidden className="mt-1 h-4 w-4 shrink-0" />
            <p>{explanation || "İlgili açıklamayı yeniden gözden geçirip başka bir seçenek deneyebilirsin."}</p>
          </div>
        ) : null}
      </fieldset>
    </section>
  );
}
