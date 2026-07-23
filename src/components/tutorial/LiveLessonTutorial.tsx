"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { fetchMe } from "@/lib/authApi";
import { queryClient } from "@/lib/queryClient";
import {
  TUTORIAL_STEPS,
  canNavigateTo,
} from "@/lib/liveLessonTutorialSteps";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MockLessonScreen } from "./MockLessonScreen";
import { TutorialCard } from "./TutorialCard";
import { TutorialOverlay, useSpotlightRects } from "./TutorialOverlay";
import { useTutorialProgress } from "./useTutorialProgress";

interface LiveLessonTutorialProps {
  /** Replay mode: watch again without reading or writing any progress. */
  replay: boolean;
}

export function LiveLessonTutorial({ replay }: LiveLessonTutorialProps) {
  const router = useRouter();
  const { updateUser } = useAuth();
  const {
    state,
    isReady,
    loadError,
    retryLoad,
    completeStep,
    goToStep,
    allDone,
    completeMutation,
  } = useTutorialProgress({ replay });

  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [completeError, setCompleteError] = useState(false);

  const step = TUTORIAL_STEPS[state.stepIndex];
  const actionDone = state.completedSteps.includes(step.id);
  const rects = useSpotlightRects(isReady && !exitDialogOpen ? step.targets : []);
  const exitHref = replay ? "/profile" : "/tutor/onboarding";

  // Reaching the summary screen is what completes the "summary" step — its CTA
  // is the completion POST itself.
  useEffect(() => {
    if (isReady && step.id === "summary") completeStep("summary");
  }, [isReady, step.id, completeStep]);

  const handleComplete = useCallback(async () => {
    setCompleteError(false);
    try {
      await completeMutation.mutateAsync();
      if (!replay) {
        // Backend is the source of truth — refresh the auth payload so every
        // gate (RouteGuard, banners, join buttons) unlocks without a relogin.
        try {
          const freshUser = await fetchMe();
          updateUser(freshUser);
        } catch {
          // Non-fatal: completion is stored server-side; the next /auth/me
          // rehydrate picks it up.
        }
        queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
        queryClient.invalidateQueries({ queryKey: ["tutor-tutorial"] });
        toast.success("Eğitim tamamlandı — hesabın canlı derslere hazır!");
      }
      router.replace(replay ? "/profile" : "/dashboard/tutor");
    } catch {
      // Idempotent endpoint: retrying is always safe; progress is already
      // persisted step by step, so nothing is lost.
      setCompleteError(true);
    }
  }, [completeMutation, replay, router, updateUser]);

  const handlePrimary = useCallback(() => {
    if (step.kind === "final") {
      if (replay) {
        router.replace("/profile");
        return;
      }
      void handleComplete();
      return;
    }
    completeStep(step.id);
    goToStep(state.stepIndex + 1);
  }, [step, replay, router, handleComplete, completeStep, goToStep, state.stepIndex]);

  // Keyboard: Escape → exit confirmation; arrows navigate (forward only over
  // completed steps, mirroring the CTA rules).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExitDialogOpen((open) => !open);
        return;
      }
      if (exitDialogOpen) return;
      if (event.key === "ArrowLeft" && state.stepIndex > 0) {
        goToStep(state.stepIndex - 1);
      } else if (
        event.key === "ArrowRight" &&
        state.completedSteps.includes(step.id) &&
        canNavigateTo(state, state.stepIndex + 1)
      ) {
        goToStep(state.stepIndex + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [exitDialogOpen, state, step.id, goToStep]);

  if (!isReady) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-white">
        {loadError ? (
          <>
            <p className="text-sm text-gray-300">
              Eğitim ilerlemen yüklenemedi. Bağlantını kontrol edip tekrar dene.
            </p>
            <button
              type="button"
              onClick={() => retryLoad()}
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400"
            >
              Tekrar dene
            </button>
          </>
        ) : (
          <LoadingSpinner />
        )}
      </div>
    );
  }

  const finalDisabled = step.kind === "final" && !replay && !allDone;

  return (
    <div className="relative h-full">
      <MockLessonScreen activeStep={step} onStepAction={completeStep} />

      <TutorialOverlay rects={rects} shielded={!exitDialogOpen} />

      {/* Screen-reader step announcements. */}
      <div aria-live="polite" className="sr-only">
        {`Adım ${state.stepIndex + 1}/${TUTORIAL_STEPS.length}: ${step.title}. ${step.body}`}
      </div>

      {!exitDialogOpen && (
        <TutorialCard
          step={step}
          stepNumber={state.stepIndex + 1}
          totalSteps={TUTORIAL_STEPS.length}
          rects={rects}
          actionDone={actionDone}
          canGoBack={state.stepIndex > 0}
          onBack={() => goToStep(state.stepIndex - 1)}
          onPrimary={handlePrimary}
          primaryDisabled={(step.kind === "try" && !actionDone) || finalDisabled}
          primaryPending={completeMutation.isPending}
          errorSlot={
            completeError ? (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200"
              >
                Tamamlama isteği gönderilemedi. İlerlemen kayıtlı — tekrar
                denemek güvenli.
              </div>
            ) : null
          }
        >
          {step.id === "summary" && (
            <SummaryChecklist completedAll={allDone || replay} />
          )}
        </TutorialCard>
      )}

      {exitDialogOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div
            role="alertdialog"
            aria-labelledby="tutorial-exit-title"
            className="w-full max-w-sm rounded-xl border border-white/10 bg-gray-900 p-5 text-white shadow-2xl"
          >
            <h2 id="tutorial-exit-title" className="text-base font-semibold">
              Eğitimden çıkılsın mı?
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              {replay
                ? "Tekrar izlemeyi istediğin zaman Profil sayfandan açabilirsin."
                : "İlerlemen kaydedildi — geri döndüğünde kaldığın adımdan devam edersin."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setExitDialogOpen(false)}
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-white/10"
              >
                Eğitime dön
              </button>
              <button
                type="button"
                onClick={() => router.replace(exitHref)}
                className="rounded-md bg-red-500/90 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Çık
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryChecklist({ completedAll }: { completedAll: boolean }) {
  const items = TUTORIAL_STEPS.filter(
    (step) => step.id !== "welcome" && step.id !== "summary"
  );
  return (
    <ul className="mt-3 space-y-1.5" aria-label="Öğrenilen konular">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex items-center gap-2 text-xs text-gray-200"
          style={{
            animation: `tutorial-check-in 0.3s ease-out both`,
            animationDelay: `${index * 90}ms`,
          }}
        >
          <span
            aria-hidden="true"
            className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
              completedAll ? "bg-emerald-500 text-white" : "bg-white/15 text-white/60"
            }`}
          >
            ✓
          </span>
          {item.title}
        </li>
      ))}
      <style jsx>{`
        @keyframes tutorial-check-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          li {
            animation: none !important;
          }
        }
      `}</style>
    </ul>
  );
}
