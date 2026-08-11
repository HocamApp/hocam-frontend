"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CoachingPlanPreview } from "@/lib/coachingApi";

const INCLUDED = [
  "Çalışma programı",
  "Deneme değerlendirmesi",
  "İlerleme raporu",
  "Kaynak önerileri",
  "Mesajlara 24 saat içinde yanıt",
];

/**
 * What a student would see on this tutor's coaching offer.
 *
 * A read-only rehearsal of the student-facing card. The data comes from a
 * separate backend serializer that excludes tutor-only internals, so this
 * cannot accidentally show capacity numbers or the price cap.
 */
export function StudentPreviewCard({ preview }: { preview: CoachingPlanPreview }) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">
              {preview.is_free ? "Ücretsiz çalışma koçluğu" : "Çalışma koçluğu"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {preview.frequency_display} · {preview.session_duration_minutes} dk
            </p>
          </div>
          {preview.capacity_available ? null : (
            <Badge variant="secondary">Kontenjan dolu</Badge>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dahil olanlar
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="text-primary">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {preview.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {preview.description}
          </p>
        ) : null}

        {preview.target_exam_types.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {preview.target_exam_types.map((examType) => (
              <Badge key={examType} variant="outline">
                {examType}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="border-t pt-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Görüşme başına: </span>
            <span className="font-semibold">
              {preview.is_free
                ? "₺0 — Ders paketinle ücretsiz"
                : preview.price_per_session_display}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
