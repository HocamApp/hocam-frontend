"use client";

import { Gauge, Users } from "lucide-react";

import { CoachingStudioPanel } from "@/components/coaching/CoachingStudioPanel";
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
  const activePercent = Math.min(100, Math.round((capacity.active_students / safeTheoretical) * 100));

  return (
    <CoachingStudioPanel className="overflow-hidden" role="region" aria-label="Koçluk kapasitesi">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(28rem,1.28fr)]">
        <div>
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gauge className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold">Kapasite</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sunucu, ayrı koçluk müsaitliğindeki 30 dakikalık saatleri seçtiğin görüşme düzenine göre kapasiteye çevirir.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium">
            <span className={`h-2 w-2 rounded-full ${capacity.can_accept_new_student ? "bg-emerald-500" : "bg-muted-foreground"}`} />
            {capacity.can_accept_new_student
              ? "Yeni öğrenci alınabilir"
              : "Yeni öğrenci alımı kapalı"}
          </div>
        </div>

        <div className="space-y-5 rounded-[1.25rem] bg-muted/40 p-4 sm:p-5">
          <dl className="grid gap-3 sm:grid-cols-2">
            <CapacityValue value={`${capacity.weekly_slot_count} haftalık slot`} label="Müsaitliğinden oluşan" />
            <CapacityValue value={`${capacity.theoretical_capacity} öğrenci teorik sınırı`} label="Görüşme düzenine göre" />
            <CapacityValue value={`${capacity.max_active_students} öğrenci seçili kapasite`} label="Senin belirlediğin" />
            <CapacityValue value={`${capacity.active_students} aktif öğrenci`} label="Şu anda hizmet alan" />
          </dl>

          {capacity.theoretical_capacity > 0 ? (
            <div className="space-y-4" aria-label="Kapasite kullanımı">
              <CapacityBar label="Seçili kapasite" percent={selectedPercent} className="bg-foreground" />
              <CapacityBar label="Aktif öğrenci yükü" percent={activePercent} className="bg-primary" />
            </div>
          ) : null}
        </div>
      </div>

      {capacity.weekly_slot_count === 0 ? (
        <div className="border-t border-border/70 bg-muted/25 px-5 py-4 sm:px-6">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Koçluk müsaitliğin yok, bu yüzden kullanılabilir koçluk slotun da
            yok. Koçluk saatlerin normal ders saatlerinden ayrıdır.
          </p>
        </div>
      ) : null}
    </CoachingStudioPanel>
  );
}

function CapacityValue({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/75 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function CapacityBar({ label, percent, className }: { label: string; percent: number; className: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">%{percent}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
