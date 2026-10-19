"use client";

import { Button } from "@/components/ui/button";
import type { CoachingPlan } from "@/lib/coachingApi";

/**
 * What a tutor can do about the offer's visibility: publish it, or, once it
 * is live, stop taking new students or take it down. One pink action while it
 * is a draft; the live actions are outlines because none of them is the
 * point of the screen. Everything is disabled while one request is in flight.
 */
export function CoachingPublishActions({
  plan,
  pending,
  onPublish,
  onUnpublish,
  onClose,
  onReopen,
}: {
  plan: Pick<CoachingPlan, "is_published" | "is_accepting_new_students">;
  pending: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onClose: () => void;
  onReopen: () => void;
}) {
  if (!plan.is_published) {
    return (
      <Button size="lg" onClick={onPublish} disabled={pending}>
        Teklifi yayınla
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {plan.is_accepting_new_students ? (
        <Button variant="outline" onClick={onClose} disabled={pending}>
          Yeni öğrenci almayı durdur
        </Button>
      ) : (
        <Button variant="outline" onClick={onReopen} disabled={pending}>
          Yeni öğrenci almayı aç
        </Button>
      )}
      <Button variant="outline" onClick={onUnpublish} disabled={pending}>
        Yayından kaldır
      </Button>
    </div>
  );
}
