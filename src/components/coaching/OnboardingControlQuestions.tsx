"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  CoachingControlQuestion,
  CoachingOnboardingState,
} from "@/lib/coachingApi";

/**
 * Comprehension check, not an exam.
 *
 * Every verdict comes from the server — this component sends the chosen
 * answer and renders whatever the API says, including the explanation to
 * re-read on a wrong answer. A wrong answer can be corrected freely.
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

  const handleSelect = async (questionId: string, value: string) => {
    const result = await onAnswer(questionId, value);
    setExplanations((current) => ({
      ...current,
      [questionId]: result.explanation,
    }));
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => {
        const recorded = answers[question.id];
        const isCorrect = recorded?.is_correct === true;
        const isWrong = recorded?.is_correct === false;
        const explanation = explanations[question.id];

        return (
          <Card key={question.id}>
            <CardContent className="space-y-3 pt-6">
              <fieldset>
                <legend className="flex items-start gap-2 text-sm font-medium">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span>{question.question}</span>
                  {isCorrect ? (
                    <CheckCircle2
                      className="ml-auto h-4 w-4 shrink-0 text-primary"
                      aria-label="Doğru"
                    />
                  ) : null}
                  {isWrong ? (
                    <XCircle
                      className="ml-auto h-4 w-4 shrink-0 text-destructive"
                      aria-label="Yanlış"
                    />
                  ) : null}
                </legend>

                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    const selected = recorded?.answer === option.value;
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
                          selected && isCorrect &&
                            "border-primary bg-primary/5 ring-1 ring-primary",
                          selected && isWrong &&
                            "border-destructive bg-destructive/5",
                          !selected && "hover:bg-muted/50"
                        )}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={selected}
                          disabled={pendingQuestionId === question.id}
                          onChange={() => handleSelect(question.id, option.value)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {isWrong && explanation ? (
                <p
                  className="rounded-md bg-muted p-3 text-xs leading-relaxed text-muted-foreground"
                  role="status"
                >
                  {explanation}
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
