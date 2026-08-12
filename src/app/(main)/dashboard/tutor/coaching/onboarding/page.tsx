"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { OnboardingCarousel } from "@/components/coaching/OnboardingCarousel";
import { OnboardingControlQuestions } from "@/components/coaching/OnboardingControlQuestions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { cn } from "@/lib/utils";
import {
  acceptCoachingContract,
  advanceCoachingOnboarding,
  completeCoachingOnboarding,
  extractCoachingErrorMessage,
  fetchCoachingOnboarding,
  submitCoachingControlAnswer,
} from "@/lib/coachingApi";

const STEP_LABELS: Record<string, string> = {
  carousel: "Tanıtım",
  control_questions: "Hızlı kontrol",
  contract: "Sözleşme",
  plan: "Teklif",
};

function OnboardingContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);

  const { data: state, isLoading } = useQuery({
    queryKey: ["coaching-onboarding"],
    queryFn: fetchCoachingOnboarding,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["coaching-onboarding"] });

  const advance = useMutation({
    mutationFn: advanceCoachingOnboarding,
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const accept = useMutation({
    mutationFn: acceptCoachingContract,
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const complete = useMutation({
    mutationFn: completeCoachingOnboarding,
    onSuccess: () => {
      setError(null);
      invalidate();
      router.push("/dashboard/tutor/coaching/plan?step=frequency");
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const handleAnswer = async (questionId: string, answer: string) => {
    setPendingQuestionId(questionId);
    try {
      const result = await submitCoachingControlAnswer(questionId, answer);
      await invalidate();
      return result;
    } catch (err) {
      setError(extractCoachingErrorMessage(err));
      return { explanation: "" };
    } finally {
      setPendingQuestionId(null);
    }
  };

  if (isLoading || !state) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (state.is_completed) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6 text-center">
          <Check className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Koçluk tanıtımı tamamlandı</h2>
          <p className="text-sm text-muted-foreground">
            Artık koçluk teklifini oluşturabilir ve müsaitliğini belirleyebilirsin.
          </p>
          <Button onClick={() => router.push("/dashboard/tutor/coaching/plan?step=frequency")}>
            Teklifini oluştur
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stepKey = state.current_step_key;

  return (
    <div className="space-y-6">
      {/* Progress indicator only — the educational content itself is the
          carousel below, not this list. */}
      <ol className="flex flex-wrap items-center gap-2" aria-label="Koçluk tanıtım adımları">
        {state.steps.map((step, index) => {
          const isDone = index < state.current_step;
          const isCurrent = index === state.current_step;
          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                isCurrent && "border-primary bg-primary/5 text-primary",
                isDone && "border-primary/40 text-muted-foreground",
                !isCurrent && !isDone && "text-muted-foreground"
              )}
            >
              {index + 1}. {STEP_LABELS[step] ?? step}
            </li>
          );
        })}
      </ol>

      {error ? <ErrorMessage message={error} /> : null}

      {stepKey === "carousel" ? (
        <section className="space-y-4">
          <OnboardingCarousel slides={state.carousel_slides} />
          <Button
            onClick={() => advance.mutate(state.current_step + 1)}
            disabled={advance.isPending}
          >
            Hızlı kontrole geç
          </Button>
        </section>
      ) : null}

      {stepKey === "control_questions" ? (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Kısa bir hatırlatma turu: amaç puan vermek değil, hizmet düzenini birlikte netleştirmek. Yanıtını istediğin kadar düzeltebilirsin.
          </p>
          <OnboardingControlQuestions
            questions={state.control_questions}
            answers={state.control_question_answers}
            onAnswer={handleAnswer}
            pendingQuestionId={pendingQuestionId}
          />
          <Button
            onClick={() => advance.mutate(state.current_step + 1)}
            disabled={!state.all_control_questions_correct || advance.isPending}
          >
            Sözleşmeye geç
          </Button>
          {!state.all_control_questions_correct ? (
            <p className="text-xs text-muted-foreground">
              Devam etmek için bütün soruları doğru cevaplaman gerekiyor.
            </p>
          ) : null}
        </section>
      ) : null}

      {stepKey === "contract" ? (
        <section className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold">
                Koçluk sözleşmesi
                {state.contract ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    v{state.contract.version}
                  </span>
                ) : null}
              </h2>
              <div className="mt-4 max-h-96 overflow-y-auto rounded-md border bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground">
                  {state.contract?.text}
                </pre>
              </div>
            </CardContent>
          </Card>

          {state.has_accepted_current_contract ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-primary">
                <Check className="h-4 w-4" aria-hidden="true" />
                Güncel sözleşmeyi kabul ettin.
              </p>
              <Button
                onClick={() => advance.mutate(state.current_step + 1)}
                disabled={advance.isPending}
              >
                Plan adımına geç
              </Button>
            </div>
          ) : (
            <Button onClick={() => accept.mutate()} disabled={accept.isPending}>
              Sözleşmeyi kabul ediyorum
            </Button>
          )}
        </section>
      ) : null}

      {stepKey === "plan" ? (
        <section className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <h2 className="text-lg font-semibold">Son adım</h2>
              <p className="text-sm text-muted-foreground">
                Tanıtımı tamamladığında koçluk teklifini oluşturabilir,
                müsaitliğini ve kapasiteni belirleyebilirsin.
              </p>
            </CardContent>
          </Card>
          <Button onClick={() => complete.mutate()} disabled={complete.isPending}>
            Tanıtımı tamamla
          </Button>
        </section>
      ) : null}
    </div>
  );
}

export default function CoachingOnboardingPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell
        title="Koçluk vermeye başla"
        description="Çalışma koçluğu özel dersten farklı bir ek hizmettir. Kapsamı gözden geçir, hızlı kontrolü tamamla ve sözleşmeyi kabul et."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Koçluk ana sayfası"
        eyebrow="Kısa tanıtım"
        width="narrow"
        currentHref="/dashboard/tutor/coaching/onboarding"
        audience="tutor"
      >
        <OnboardingContent />
      </CoachingPageShell>
    </CoachingGuard>
  );
}
