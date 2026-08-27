import type { ReactNode } from "react";
import { HourglassSimple, type Icon } from "@phosphor-icons/react";

import { CoachingStudioPanel } from "@/components/coaching/CoachingStudioPanel";
import { COACHING_SECTION_TITLE_CLASS } from "@/components/coaching/CoachingSectionHeading";

export function CoachingEmptyState({
  icon: Icon,
  title,
  description,
  context,
  actions,
  action,
  steps,
  tone = "soft",
}: {
  icon?: Icon;
  title: string;
  description: string;
  context?: string;
  actions?: ReactNode;
  action?: ReactNode;
  steps?: readonly string[];
  tone?: "soft" | "accent";
}) {
  const EmptyIcon = Icon ?? HourglassSimple;
  return (
    <CoachingStudioPanel tone={tone}>
      <div className="max-w-2xl p-6 sm:p-8">
        <div>
          <div
            aria-label="Boş durum simgesi"
            className="mb-6 flex h-12 w-12 items-center justify-center rounded-input border border-line bg-paper text-ink"
          >
            <EmptyIcon aria-hidden className="h-8 w-8" weight="regular" />
          </div>
          <h2 className={COACHING_SECTION_TITLE_CLASS}>{title}</h2>
          <p className="mt-3 max-w-xl text-body leading-[1.6] text-ink-mid">
            {description}
          </p>
          {context ? (
            <p className="mt-3 max-w-xl text-small leading-[1.5] text-ink-mid">
              {context}
            </p>
          ) : null}
          {steps && steps.length > 0 ? (
            <ol
              aria-label="Bu alanda izleyeceğin akış"
              className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2"
            >
              {steps.map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-3 text-small leading-[1.5] text-ink"
                >
                  <span
                    className="tabular-nums text-ink-mid"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {actions || action ? (
            <div
              data-testid="coaching-empty-actions"
              className="mt-6 flex flex-wrap gap-2"
            >
              {actions ?? action}
            </div>
          ) : null}
        </div>
      </div>
    </CoachingStudioPanel>
  );
}
