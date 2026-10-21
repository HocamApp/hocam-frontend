import Link from "next/link";
import { Check } from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import {
  coachingSetupSteps,
  type CoachingDerivedStatus,
  type CoachingSetupStepState,
} from "@/lib/coachingPresentation";
import { CoachingPlatformNotice } from "./CoachingPlatformNotice";
import { COACHING_SECTION_TITLE_CLASS } from "./CoachingSectionHeading";
import { CoachingStudioPanel } from "./CoachingStudioPanel";

const STATE_TEXT: Record<CoachingSetupStepState, string> = {
  done: "Tamamlandı.",
  current: "Sıradaki adım.",
  pending: "Bekliyor.",
};

/** The marker says the state with a shape too, so colour is never the only signal. */
function Marker({ state }: { state: CoachingSetupStepState }) {
  if (state === "done") {
    return (
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-gold-ink"
      >
        <Check className="h-3 w-3" weight="bold" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${state === "current" ? "border-pink" : "border-line"}`}
    />
  );
}

/**
 * What is left of getting the coaching offer ready, for a tutor whose setup is
 * not finished (the overview shows nothing here once it is). Five steps: the
 * ones before the open step are done, the open one says what it asks for and
 * carries the one way forward, solid gold like every row action on the tutor
 * side, and the rest wait unless the status says they are done already. The page's pink belongs to the
 * band of "Yapılacaklar" below, so the card spends it only on the open step's
 * marker.
 */
export function CoachingStatusCard({ status }: { status: CoachingDerivedStatus }) {
  const steps = coachingSetupSteps(status.readiness, status.stepsDone);
  const published = status.publication === "published";

  return (
    <div className="space-y-3">
      <CoachingStudioPanel role="region" aria-label="Koçluk hizmet durumu" className="p-5 sm:p-6">
        <h2 className={COACHING_SECTION_TITLE_CLASS}>Teklifin için kalan adımlar</h2>
        {published ? (
          <p className="mt-1 text-small text-ink-mid">Teklifin yayında; aşağıdaki adım eksik kaldı.</p>
        ) : null}

        <ol aria-label="Kurulum adımları" className="mt-3 divide-y divide-line">
          {steps.map((step) => (
            <li key={step.key} className="flex gap-3 py-3">
              <Marker state={step.state} />
              <div className="min-w-0 flex-1">
                <p className={step.state === "current" ? "text-body font-medium text-ink" : "text-body text-ink-mid"}>
                  <span className="sr-only">{STATE_TEXT[step.state]}</span>{" "}
                  <span>{step.title}</span>
                  {step.hint ? (
                    <>
                      {" "}
                      <span className="text-small">{`(${step.hint})`}</span>
                    </>
                  ) : null}
                </p>
                {step.state === "current" ? (
                  <>
                    <p className="mt-1 max-w-xl text-body text-ink-mid">{step.detail}</p>
                    {status.nextAction ? (
                      <Button asChild variant="gold" size="sm" className="mt-3 min-h-11">
                        <Link href={status.nextAction.href}>{status.nextAction.label}</Link>
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CoachingStudioPanel>

      {status.platformMessage ? <CoachingPlatformNotice message={status.platformMessage} /> : null}
    </div>
  );
}
