"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoachingPlan, CoachingPlanPreview, CoachingRevenuePreview } from "@/lib/coachingApi";
import type { CoachingSettingRow } from "@/lib/coachingPlanSummary";
import { COACHING_SETUP_STEP_TITLES, type CoachingSetupStep } from "@/lib/coachingSetup";
import { CoachingPublishPanel } from "./CoachingPublishPanel";
import { CoachingSettingRows } from "./CoachingSettingRows";
import { RevenuePreviewCard } from "./RevenuePreviewCard";
import { StudentPreviewCard } from "./StudentPreviewCard";

/**
 * The last step: look at the offer the way a student will, check that every
 * setting is in, then publish. Preview and publishing used to be two steps; a
 * tutor who had just looked at the preview had nothing to decide before the
 * publish button, so they are one.
 *
 * If a setting is missing the publish action is held back and the way to the
 * unfinished step is offered instead, because publishing would only fail on
 * the server and bounce the tutor there anyway.
 */
export function CoachingReviewStep({
  plan,
  preview,
  revenue,
  rows,
  missingSteps,
  error,
  actions,
}: {
  plan: Pick<CoachingPlan, "is_published" | "is_accepting_new_students">;
  preview: CoachingPlanPreview | null;
  revenue: CoachingRevenuePreview | null;
  rows: readonly CoachingSettingRow[];
  missingSteps: readonly CoachingSetupStep[];
  error: string | null;
  actions: ReactNode;
}) {
  const firstMissing = missingSteps[0];
  const missingTitles = missingSteps.map((step) => COACHING_SETUP_STEP_TITLES[step]).join(", ");

  return (
    <div className="space-y-5">
      {error ? <ErrorMessage message={error} /> : null}

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-2">
          <p className="text-label text-ink-mid">Öğrenci seni böyle görür</p>
          {preview ? <StudentPreviewCard preview={preview} /> : <Skeleton className="h-72" />}
        </div>

        <div className="space-y-5">
          <section className="space-y-2">
            <h2 className="text-label font-medium text-ink-mid">Hazır olanlar</h2>
            <div className="overflow-hidden rounded-card border border-line bg-surface">
              <CoachingSettingRows rows={rows} leading="check" ariaLabel="Hazır olanlar" />
            </div>
          </section>
          {revenue ? <RevenuePreviewCard preview={revenue} /> : <Skeleton className="h-56" />}
        </div>
      </div>

      {firstMissing ? (
        <div className="flex flex-wrap items-center gap-3">
          <InlineError
            message={`Yayınlamadan önce şu ${missingSteps.length > 1 ? "adımları" : "adımı"} tamamla: ${missingTitles}.`}
          />
          <Button asChild size="sm" variant="gold" className="min-h-11">
            <Link href={`/dashboard/tutor/coaching/plan?step=${firstMissing}`}>Eksik adıma git</Link>
          </Button>
        </div>
      ) : (
        <CoachingPublishPanel
          plan={plan}
          actions={actions}
          className="rounded-card border border-line"
        />
      )}
    </div>
  );
}
