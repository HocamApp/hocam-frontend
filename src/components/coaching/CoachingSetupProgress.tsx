import Link from "next/link";
import { Check, LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";
import { COACHING_SETUP_STEPS, type CoachingSetupStep } from "@/lib/coachingSetup";

const STEP_LABELS: Record<CoachingSetupStep, string> = {
  frequency: "Görüşme düzeni",
  price: "Koçluk fiyatı",
  exams: "Koçluk verdiğin sınavlar",
  description: "Kısa açıklama",
  availability: "Koçluk müsaitliği",
  capacity: "Kapasite",
  preview: "Öğrenci görünümü",
  publish: "Yayınlama",
};

export function CoachingSetupProgress({
  currentStep,
  unlockedSteps,
}: {
  currentStep: CoachingSetupStep;
  unlockedSteps: readonly CoachingSetupStep[];
}) {
  const currentIndex = COACHING_SETUP_STEPS.indexOf(currentStep);
  return (
    <nav aria-label="Koçluk kurulum adımları" className="overflow-x-auto pb-2">
      <ol className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-8">
        {COACHING_SETUP_STEPS.map((step, index) => {
          const unlocked = unlockedSteps.includes(step);
          const current = step === currentStep;
          const complete = index < currentIndex;
          const content = (
            <>
              <span
                className={cn(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                  current && "border-foreground bg-foreground text-background",
                  complete && !current && "border-emerald-600 bg-emerald-50 text-emerald-700",
                  !complete && !current && "text-muted-foreground"
                )}
              >
                {complete ? <Check aria-hidden className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="max-w-28 text-xs font-medium leading-4">{STEP_LABELS[step]}</span>
              {!unlocked ? <LockKeyhole aria-hidden className="h-3 w-3 text-muted-foreground" /> : null}
            </>
          );
          return (
            <li key={step}>
              {unlocked ? (
                <Link
                  href={`?step=${step}`}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex min-h-14 items-center gap-2 rounded-lg border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:h-full lg:flex-col lg:items-start",
                    current ? "border-foreground bg-muted/50" : "hover:bg-muted/30"
                  )}
                >
                  {content}
                </Link>
              ) : (
                <div aria-disabled="true" className="flex min-h-14 items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-muted-foreground lg:h-full lg:flex-col lg:items-start">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
