"use client";

import { STUDY_SCHEDULE_ENABLED } from "@/lib/featureFlags";

/**
 * Whether the study programme is available to this viewer.
 *
 * Build-time only, unlike `useCoachingFlag`: the backend gate for this
 * feature is a single env flag with no runtime half to poll, so there is
 * nothing to fetch and no loading state to model.
 */
export function useScheduleFlag(): boolean {
  return STUDY_SCHEDULE_ENABLED;
}
