"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { ProfileToggleRow } from "@/components/profile/ProfileMenuRow";
import {
  fetchTutorPackageOffers,
  updateTutorPackageOffers,
} from "@/lib/paymentsApi";
import { calculatePackagePricing, formatPlanDuration } from "@/lib/lessonPricing";
import { formatPrice } from "@/lib/utils";
import type { TutorPackageOffer } from "@/types";

interface TutorPackageOffersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The tutor's own hourly_price — only used for the live student-facing
   * price preview per plan, never sent to the server (the backend already
   * knows it and recomputes independently at purchase time). */
  tutorHourlyPrice: number;
}

interface DraftOffer {
  is_offered: boolean;
  discount_percent: number | null;
}

export function TutorPackageOffersDialog({
  open,
  onOpenChange,
  tutorHourlyPrice,
}: TutorPackageOffersDialogProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["tutor-package-offers"],
    queryFn: fetchTutorPackageOffers,
    enabled: open,
  });

  // Keyed by plan_id, seeded from server data whenever it arrives (dialog
  // open, or after a save) — edits happen here so sliders/toggles can move
  // freely before Kaydet commits them.
  const [drafts, setDrafts] = useState<Record<string, DraftOffer>>({});

  useEffect(() => {
    if (data) {
      setDrafts(
        Object.fromEntries(
          data.map((offer) => [
            offer.plan_id,
            { is_offered: offer.is_offered, discount_percent: offer.discount_percent },
          ])
        )
      );
    }
  }, [data]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () =>
      updateTutorPackageOffers(
        Object.entries(drafts).map(([plan_id, draft]) => ({
          plan_id,
          is_offered: draft.is_offered,
          discount_percent: draft.discount_percent,
        }))
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(["tutor-package-offers"], updated);
      toast.success("Paket ayarları kaydedildi.");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Paket ayarları kaydedilemedi. Lütfen tekrar deneyin.");
    },
  });

  const setDraft = (planId: string, next: Partial<DraftOffer>) => {
    setDrafts((prev) => ({ ...prev, [planId]: { ...prev[planId], ...next } }));
  };

  const planLabel = (offer: TutorPackageOffer) =>
    `Haftada ${offer.lessons_per_week} · ${formatPlanDuration(offer.duration_days)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100dvw-1rem)] max-w-[calc(100dvw-1rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Paketlerim</DialogTitle>
          <DialogDescription>
            Hangi paketleri sunduğunu ve öğrencilere yansıyan indirimi buradan belirle.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message="Paket ayarları yüklenemedi." />
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto py-2">
            {(data ?? []).map((offer) => {
              const draft = drafts[offer.plan_id] ?? {
                is_offered: offer.is_offered,
                discount_percent: offer.discount_percent,
              };
              const discount = draft.discount_percent ?? offer.catalog_discount_percent;
              const pricing = calculatePackagePricing(
                tutorHourlyPrice,
                offer.lesson_count,
                discount
              );
              return (
                <div
                  key={offer.plan_id}
                  className="space-y-3 rounded-lg border border-border p-3"
                >
                  <ProfileToggleRow
                    label={planLabel(offer)}
                    checked={draft.is_offered}
                    onChange={(next) => setDraft(offer.plan_id, { is_offered: next })}
                    disabled={isSaving}
                  />
                  {draft.is_offered && (
                    <div className="space-y-2 pl-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>İndirim</span>
                        <span className="font-medium text-foreground">%{discount}</span>
                      </div>
                      <Slider
                        aria-label={`${planLabel(offer)} indirimi`}
                        min={0}
                        max={offer.max_discount_percent}
                        step={1}
                        value={[Math.min(discount, offer.max_discount_percent)]}
                        onValueChange={([value]) =>
                          setDraft(offer.plan_id, { discount_percent: value })
                        }
                        disabled={isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Öğrenci fiyatı: <span className="font-medium text-foreground">{formatPrice(pricing.total)}</span>{" "}
                        ({offer.lesson_count} ders)
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Vazgeç
          </Button>
          <Button onClick={() => save()} disabled={isLoading || !!error || isSaving}>
            {isSaving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
