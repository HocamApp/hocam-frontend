"use client";

import type { CoachingPlanPreview } from "@/lib/coachingApi";
import { CoachingOfferCard } from "./CoachingOfferCard";

export function StudentPreviewCard({ preview }: { preview: CoachingPlanPreview }) {
  return (
    <CoachingOfferCard
      offer={{
        frequencyLabel: preview.frequency_display,
        sessionDurationMinutes: preview.session_duration_minutes,
        priceMinor: preview.price_per_session_minor,
        isFree: preview.is_free,
        examTypes: preview.target_exam_types,
        description: preview.description,
        capacityAvailable: preview.capacity_available,
      }}
    />
  );
}
