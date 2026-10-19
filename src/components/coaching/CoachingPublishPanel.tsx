"use client";

import type { ReactNode } from "react";

import type { CoachingPlan } from "@/lib/coachingApi";

function publishSentence(plan: Pick<CoachingPlan, "is_published" | "is_accepting_new_students">): string {
  if (!plan.is_published) return "Teklifin öğrencilere görünmüyor. Yayınlayınca başvuru alabilirsin.";
  if (!plan.is_accepting_new_students) return "Teklifin yayında ama yeni öğrenci almıyorsun.";
  return "Öğrenciler teklifini görüp başvurabiliyor.";
}

/**
 * The row that says whether the offer is live and holds the controls for it.
 * One component for both places it appears (the foot of the summary card and
 * the end of the review step) so the sentence and the layout cannot drift.
 */
export function CoachingPublishPanel({
  plan,
  actions,
  className,
}: {
  plan: Pick<CoachingPlan, "is_published" | "is_accepting_new_students">;
  actions: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label="Yayın durumu"
      className={`flex flex-col gap-3 bg-paper px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${className ?? ""}`}
    >
      <div>
        <h2 className="text-body font-bold text-ink">Yayın durumu</h2>
        <p className="mt-0.5 text-small text-ink-mid">{publishSentence(plan)}</p>
      </div>
      {actions}
    </section>
  );
}
