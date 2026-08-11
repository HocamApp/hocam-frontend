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
  const safeTheoretical = Math.max(1, capacity.theoretical_capacity);
  const selectedPercent = Math.min(100, Math.round((capacity.max_active_students / safeTheoretical) * 100));

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

        <p className="text-sm leading-6 text-muted-foreground">
          Sunucu, ayrı koçluk müsaitliğindeki 30 dakikalık saatleri seçtiğin görüşme düzenine göre kapasiteye çevirir.
        </p>

        <dl className="grid gap-3 sm:grid-cols-2">
          <CapacityValue value={`${capacity.weekly_slot_count} haftalık slot`} label="Müsaitliğinden oluşan" />
          <CapacityValue value={`${capacity.theoretical_capacity} öğrenci teorik sınırı`} label="Görüşme düzenine göre" />
          <CapacityValue value={`${capacity.max_active_students} öğrenci seçili kapasite`} label="Senin belirlediğin" />
          <CapacityValue value={`${capacity.active_students} aktif öğrenci`} label="Şu anda hizmet alan" />
        </dl>

        {capacity.theoretical_capacity > 0 ? (
          <div className="space-y-2" aria-label="Seçili kapasitenin teorik sınıra oranı">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Seçili kapasite</span>
              <span>%{selectedPercent}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${selectedPercent}%` }} />
            </div>
          </div>
        ) : null}

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

function CapacityValue({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
