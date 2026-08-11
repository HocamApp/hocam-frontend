"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CoachingCapacityDetail } from "@/lib/coachingApi";

/**
 * Capacity panel.
 *
 * `can_accept_new_student` is computed by the backend from published state,
 * the tutor's own intake preference, the student count, the theoretical
 * capacity, and the current price cap — so this card never re-derives it.
 */
export function CapacityPreviewCard({
  capacity,
}: {
  capacity: CoachingCapacityDetail;
}) {
  const rows = [
    { label: "Haftalık koçluk slotu", value: capacity.weekly_slot_count },
    { label: "Teorik kapasite", value: capacity.theoretical_capacity },
    { label: "Belirlediğin kapasite", value: capacity.max_active_students },
    { label: "Aktif koçluk öğrencisi", value: capacity.active_students },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Kapasite</h2>
          <Badge variant={capacity.can_accept_new_student ? "default" : "secondary"}>
            {capacity.can_accept_new_student
              ? "Yeni öğrenci alınabilir"
              : "Yeni öğrenci alımı kapalı"}
          </Badge>
        </div>

        <dl className="space-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>

        {capacity.weekly_slot_count === 0 ? (
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Koçluk müsaitliğin yok, bu yüzden kullanılabilir koçluk slotun da
            yok. Koçluk saatlerin normal ders saatlerinden ayrıdır.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
