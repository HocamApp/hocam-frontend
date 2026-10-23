"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  acceptCoachingContract,
  advanceCoachingOnboarding,
  completeCoachingOnboarding,
  extractCoachingErrorMessage,
  fetchCoachingOnboarding,
  submitCoachingControlAnswer,
} from "@/lib/coachingApi";
import { controlGateNote, controlProgress, onboardingStage, onboardingStepper } from "@/lib/coachingOnboarding";
import { OnboardingControlQuestions } from "./OnboardingControlQuestions";
import { OnboardingContract, OnboardingDone, OnboardingIntro, OnboardingStepper } from "./OnboardingParts";

const QUERY_KEY = ["coaching-onboarding"] as const;

/**
 * The tutor's coaching introduction in three steps: what coaching is, a quick
 * check of the rules, the contract. The contract step ends it: one tap accepts
 * and finishes (the server needs nothing more), and the last screen says what
 * the tutor sets up next. What is right or wrong, and whether a step may be left,
 * is the server's call; this only asks and shows.
 */
export function CoachingOnboardingFlow() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const { data: state, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCoachingOnboarding,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const advance = useMutation({
    mutationFn: advanceCoachingOnboarding,
    onSuccess: () => {
      setError(null);
      return invalidate();
    },
    onError: (failure) => setError(extractCoachingErrorMessage(failure)),
  });

  const answer = async (questionId: string, value: string) => {
    setPendingQuestionId(questionId);
    try {
      const result = await submitCoachingControlAnswer(questionId, value);
      await invalidate();
      return result;
    } catch (failure) {
      setError(extractCoachingErrorMessage(failure));
      return { explanation: "" };
    } finally {
      setPendingQuestionId(null);
    }
  };

  if (isError && !state) {
    return (
      <CoachingLoadError
        message="Koçluk kurulumun yüklenemedi. Bağlantını kontrol edip tekrar dene."
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }
  if (isLoading || !state) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const stage = onboardingStage(state);
  if (stage === "done") return <OnboardingDone />;

  const progress = controlProgress(state.control_questions, state.control_question_answers);
  const gate = controlGateNote(progress);
  const goOn = () => advance.mutate(state.current_step + 1);

  const finish = async () => {
    setError(null);
    setFinishing(true);
    try {
      // The acceptance is recorded before anything else; if finishing then fails,
      // the page is read again, shows the contract as accepted, and offers only to finish.
      if (!state.has_accepted_current_contract) {
        await acceptCoachingContract();
        await invalidate();
      }
      await completeCoachingOnboarding();
      await invalidate();
    } catch (failure) {
      setError(extractCoachingErrorMessage(failure));
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <OnboardingStepper steps={onboardingStepper(stage)} />

      {stage === "intro" ? (
        <>
          <OnboardingIntro slides={state.carousel_slides} />
          <Button type="button" size="sm" variant="gold" className="min-h-11" disabled={advance.isPending} onClick={goOn}>
            Hızlı kontrole geç
          </Button>
        </>
      ) : null}

      {stage === "questions" ? (
        <>
          <p className="max-w-[70ch] text-body text-ink-mid">
            Doğru yanıtı bulana kadar deneyebilirsin; yanlış yanıtta kısa bir açıklama çıkar. Amaç puan vermek değil,
            kuralları netleştirmek.
          </p>
          <OnboardingControlQuestions
            questions={state.control_questions}
            answers={state.control_question_answers}
            onAnswer={answer}
            pendingQuestionId={pendingQuestionId}
          />
          {gate ? <p className="text-small text-ink-mid">{gate}</p> : null}
          <Button
            type="button"
            size="sm"
            variant="gold"
            className="min-h-11"
            disabled={progress.remaining > 0 || advance.isPending}
            onClick={goOn}
          >
            Sözleşmeye geç
          </Button>
        </>
      ) : null}

      {stage === "contract" ? (
        <>
          <OnboardingContract contract={state.contract} />
          <p className="text-small text-ink-mid">
            {state.has_accepted_current_contract ? "Güncel sözleşmeyi kabul ettin." : "Kabul edince tanıtım biter."}
          </p>
          <Button type="button" size="sm" variant="gold" className="min-h-11" disabled={finishing} onClick={() => void finish()}>
            {state.has_accepted_current_contract ? "Tanıtımı bitir" : "Kabul ediyorum, bitir"}
          </Button>
        </>
      ) : null}

      <InlineError size="sm" message={error} />
    </div>
  );
}
