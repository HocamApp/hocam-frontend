import type { ReactNode } from "react";
import { Check, Sparkles, type LucideIcon } from "lucide-react";

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
  icon?: LucideIcon;
  title: string;
  description: string;
  context?: string;
  actions?: ReactNode;
  action?: ReactNode;
  steps?: readonly string[];
  tone?: "soft" | "accent";
}) {
  const EmptyIcon = Icon ?? Sparkles;
  return (
    <CoachingStudioPanel tone={tone} className="overflow-hidden border-dashed">
      <div className="grid min-h-64 gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-center">
        <div className="max-w-2xl">
          <div
            aria-label="Boş durum görseli"
            className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-primary/15 bg-background text-primary shadow-sm"
          >
            <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-primary/15" aria-hidden="true" />
            <EmptyIcon aria-hidden className="h-7 w-7" />
          </div>
          <h2 className={COACHING_SECTION_TITLE_CLASS}>{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
          {context ? <p className="mt-3 max-w-xl text-xs leading-5 text-muted-foreground">{context}</p> : null}
          {steps && steps.length > 0 ? (
            <ol aria-label="Bu alanda izleyeceğin akış" className="mt-5 grid gap-2 sm:grid-cols-2">
              {steps.map((step) => (
                <li key={step} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-primary">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          ) : null}
          {actions || action ? (
            <div data-testid="coaching-empty-actions" className="mt-6 flex flex-wrap gap-2">{actions ?? action}</div>
          ) : null}
        </div>
        <div aria-hidden="true" className="relative hidden h-44 lg:block">
          <div className="absolute inset-x-4 bottom-3 h-24 rotate-[-4deg] rounded-[2rem] border border-border/80 bg-background/70" />
          <div className="absolute inset-x-0 bottom-8 h-24 rotate-[5deg] rounded-[2rem] border border-primary/10 bg-primary/10" />
          <div className="absolute inset-x-7 bottom-14 flex h-24 items-center justify-center rounded-[2rem] border border-border/70 bg-background shadow-sm">
            <EmptyIcon className="h-9 w-9 text-primary/70" />
          </div>
        </div>
      </div>
    </CoachingStudioPanel>
  );
}
