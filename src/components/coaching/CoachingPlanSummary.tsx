"use client";

import type { ReactNode } from "react";
import { Check } from "@phosphor-icons/react";

import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import type { CoachingCapacityDetail, CoachingPlan } from "@/lib/coachingApi";
import type { CoachingSettingRow } from "@/lib/coachingPlanSummary";
import { CoachingPublishPanel } from "./CoachingPublishPanel";
import { CoachingSettingRows } from "./CoachingSettingRows";

/**
 * A finished setup, as one list: a pink band that says where the offer stands,
 * a row per setting with its own Düzenle, and the publish controls at the
 * foot. The wizard exists for the first setup only; after that a change is one
 * tap on one row, not a walk through seven steps.
 *
 * Pink because this is the offer students act on; the tutor's own records get
 * the ink band elsewhere. The status pill is gold when live (achievement) and
 * a plain outline when not, so a draft never looks celebrated.
 */
export function CoachingPlanSummary({
  plan,
  rows,
  capacity,
  error,
  actions,
}: {
  plan: CoachingPlan;
  rows: readonly CoachingSettingRow[];
  capacity: CoachingCapacityDetail | null;
  error?: string | null;
  actions: ReactNode;
}) {
  const free = capacity ? Math.max(0, plan.max_active_students - capacity.active_students) : null;
  const subtitle = capacity
    ? `${capacity.active_students} aktif öğrenci · ${free} boş kontenjan`
    : undefined;

  return (
    <div className="space-y-4">
      {error ? <ErrorMessage message={error} /> : null}

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className={sectionBandClass("pink", "flex-wrap")}>
          <SectionBandHeading id="coaching-plan-summary-title" title="Koçluk teklifin" subtitle={subtitle} />
          {plan.is_published ? (
            <SectionBandCount tone="pink" className="gap-1">
              <Check aria-hidden="true" className="h-3.5 w-3.5" weight="bold" />
              Yayında
            </SectionBandCount>
          ) : (
            // A template string, not cn(): tailwind-merge reads `text-label` as a colour.
            <span className="inline-flex shrink-0 items-center rounded-pill border border-primary-foreground px-3 py-0.5 text-label">
              Yayında değil
            </span>
          )}
        </div>

        <CoachingSettingRows rows={rows} leading="icon" />

        <CoachingPublishPanel plan={plan} actions={actions} className="border-t border-line" />
      </div>
    </div>
  );
}
