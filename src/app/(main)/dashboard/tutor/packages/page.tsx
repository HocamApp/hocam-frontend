"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProfileToggleRow } from "@/components/profile/ProfileMenuRow";
import { cn, formatPrice } from "@/lib/utils";
import { fetchTutorPackageOffers, updateTutorPackageOffers } from "@/lib/paymentsApi";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import {
  WEEKLY_LESSON_OPTIONS,
  calculatePackagePricing,
  formatPlanDuration,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import {
  computeChangedOffers,
  draftsFromOffers,
  type DraftOffer,
} from "@/lib/tutorPackageOffers";
import type { TutorPackageOffer } from "@/types";

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Sıklık",
  2: "Süre ve indirim",
  3: "Özet",
};

function planLabel(offer: TutorPackageOffer): string {
  return `Haftada ${offer.lessons_per_week} · ${formatPlanDuration(offer.duration_days)}`;
}

export default function TutorPackagesPage() {
  return (
    <RouteGuard requireAuth requireRole="tutor">
      <TutorPackagesContent />
    </RouteGuard>
  );
}

function TutorPackagesContent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
  });
  const {
    data: offers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tutor-package-offers"],
    queryFn: fetchTutorPackageOffers,
  });

  const [step, setStep] = useState<Step>(1);
  const [drafts, setDrafts] = useState<Record<string, DraftOffer>>({});
  // Seeded once from the first successful fetch, then left alone — a
  // background refetch (react-query) must never clobber in-progress edits.
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (offers && !initialized) {
      setDrafts(draftsFromOffers(offers));
      setInitialized(true);
    }
  }, [offers, initialized]);

  const offersByFrequency = useMemo(() => {
    const map = new Map<number, TutorPackageOffer[]>();
    for (const o of offers ?? []) {
      const list = map.get(o.lessons_per_week) ?? [];
      list.push(o);
      map.set(o.lessons_per_week, list);
    }
    for (const list of Array.from(map.values())) {
      list.sort((a, b) => a.duration_days - b.duration_days);
    }
    return map;
  }, [offers]);

  // Derived, not independent state: a frequency reads as "selected" when
  // at least one of its 4 duration plans is currently offered in the
  // draft. This way turning every individual duration off in Step 2
  // automatically un-selects the frequency back in Step 1 — no separate
  // state to keep in sync.
  const selectedFrequencies = useMemo(() => {
    const set = new Set<WeeklyLessonOption>();
    for (const o of offers ?? []) {
      if (drafts[o.plan_id]?.is_offered) {
        set.add(o.lessons_per_week as WeeklyLessonOption);
      }
    }
    return set;
  }, [offers, drafts]);

  const setDraft = (planId: string, next: Partial<DraftOffer>) => {
    setDrafts((prev) => ({ ...prev, [planId]: { ...prev[planId], ...next } }));
  };

  // A frequency the tutor doesn't select means all four of its duration
  // plans are turned off — toggling here only ever touches is_offered,
  // never discount_percent, so a discount set earlier survives a later
  // re-enable within the same session.
  const toggleFrequency = (freq: WeeklyLessonOption) => {
    const plans = offersByFrequency.get(freq) ?? [];
    const nextOffered = !selectedFrequencies.has(freq);
    setDrafts((prev) => {
      const next = { ...prev };
      for (const plan of plans) {
        next[plan.plan_id] = { ...next[plan.plan_id], is_offered: nextOffered };
      }
      return next;
    });
  };

  const tutorHourlyPrice = profile?.hourly_price ?? 0;

  const offeredPlans = useMemo(
    () =>
      (offers ?? [])
        .filter((o) => drafts[o.plan_id]?.is_offered)
        .sort((a, b) => a.lessons_per_week - b.lessons_per_week || a.duration_days - b.duration_days),
    [offers, drafts]
  );

  const changedOffers = useMemo(
    () => (offers ? computeChangedOffers(offers, drafts) : []),
    [offers, drafts]
  );

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () => updateTutorPackageOffers(changedOffers),
    onSuccess: (updated) => {
      queryClient.setQueryData(["tutor-package-offers"], updated);
      toast.success("Paket ayarların kaydedildi.");
      router.push("/dashboard/tutor");
    },
    onError: () => {
      toast.error("Paket ayarları kaydedilemedi. Lütfen tekrar deneyin.");
    },
  });

  const handleSave = () => {
    if (changedOffers.length === 0) {
      toast.info("Değişiklik yapılmadı.");
      router.push("/dashboard/tutor");
      return;
    }
    save();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/dashboard/tutor")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Panele dön
        </Button>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Paketlerim</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hangi paketleri sunduğunu, süresini ve indirimini buradan belirle.
      </p>

      <ol className="mt-6 flex items-center gap-2 text-sm" aria-label="Adımlar">
        {([1, 2, 3] as const).map((s, index) => (
          <li key={s} className="flex items-center gap-2">
            {index > 0 && <span className="h-px w-6 bg-border" aria-hidden />}
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium",
                step === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  step === s ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {s}
              </span>
              {STEP_LABELS[s]}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : error || !offers ? (
          <div className="py-8">
            <ErrorMessage message="Paket ayarları yüklenemedi." />
            <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
              Tekrar dene
            </Button>
          </div>
        ) : step === 1 ? (
          <StepFrequency
            selectedFrequencies={selectedFrequencies}
            onToggle={toggleFrequency}
          />
        ) : step === 2 ? (
          <StepDurationsAndDiscount
            selectedFrequencies={selectedFrequencies}
            offersByFrequency={offersByFrequency}
            drafts={drafts}
            setDraft={setDraft}
            tutorHourlyPrice={tutorHourlyPrice}
            isSaving={isSaving}
          />
        ) : (
          <StepSummary offeredPlans={offeredPlans} drafts={drafts} tutorHourlyPrice={tutorHourlyPrice} />
        )}
      </div>

      {!isLoading && !error && offers && (
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => (s - 1) as Step)}
            disabled={step === 1 || isSaving}
          >
            Geri
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={step === 1 && selectedFrequencies.size === 0}
            >
              İleri
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          )}
        </div>
      )}
      {step === 1 && selectedFrequencies.size === 0 && (
        <p className="mt-2 text-right text-xs text-muted-foreground">
          Devam etmek için en az bir sıklık seç.
        </p>
      )}
    </div>
  );
}

function StepFrequency({
  selectedFrequencies,
  onToggle,
}: {
  selectedFrequencies: Set<WeeklyLessonOption>;
  onToggle: (freq: WeeklyLessonOption) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Haftada kaç ders verebilirsin?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Seçmediğin sıklıklara ait tüm paketler öğrencilere kapalı olur.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Haftalık ders sıklığı">
        {WEEKLY_LESSON_OPTIONS.map((count) => {
          const selected = selectedFrequencies.has(count);
          return (
            <button
              key={count}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(count)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected && "border-primary bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              Haftada {count}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDurationsAndDiscount({
  selectedFrequencies,
  offersByFrequency,
  drafts,
  setDraft,
  tutorHourlyPrice,
  isSaving,
}: {
  selectedFrequencies: Set<WeeklyLessonOption>;
  offersByFrequency: Map<number, TutorPackageOffer[]>;
  drafts: Record<string, DraftOffer>;
  setDraft: (planId: string, next: Partial<DraftOffer>) => void;
  tutorHourlyPrice: number;
  isSaving: boolean;
}) {
  const frequencies = WEEKLY_LESSON_OPTIONS.filter((f) => selectedFrequencies.has(f));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Süre ve indirim</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Seçtiğin her sıklık için hangi paket sürelerini sunduğunu ve indirimini belirle.
        </p>
      </div>
      {frequencies.map((freq) => (
        <section key={freq}>
          <h3 className="text-sm font-semibold text-foreground">Haftada {freq}</h3>
          <div className="mt-2 space-y-3">
            {(offersByFrequency.get(freq) ?? []).map((offer) => {
              const draft = drafts[offer.plan_id] ?? {
                is_offered: offer.is_offered,
                discount_percent: offer.discount_percent,
              };
              const discount = draft.discount_percent ?? offer.catalog_discount_percent;
              const pricing = calculatePackagePricing(tutorHourlyPrice, offer.lesson_count, discount);
              return (
                <div key={offer.plan_id} className="space-y-3 rounded-lg border border-border p-3">
                  <ProfileToggleRow
                    label={formatPlanDuration(offer.duration_days)}
                    checked={draft.is_offered}
                    onChange={(next) => setDraft(offer.plan_id, { is_offered: next })}
                    disabled={isSaving}
                  />
                  {draft.is_offered && (
                    <div className="space-y-2 pl-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          İndirim{" "}
                          <span className="text-muted-foreground/70">
                            (katalog varsayılanı %{offer.catalog_discount_percent})
                          </span>
                        </span>
                        <span className="font-medium text-foreground">%{discount}</span>
                      </div>
                      <Slider
                        aria-label={`${planLabel(offer)} indirimi`}
                        min={0}
                        max={offer.max_discount_percent}
                        step={1}
                        value={[Math.min(discount, offer.max_discount_percent)]}
                        onValueChange={([value]) => setDraft(offer.plan_id, { discount_percent: value })}
                        disabled={isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Öğrenci fiyatı:{" "}
                        <span className="font-medium text-foreground">{formatPrice(pricing.total)}</span>{" "}
                        ({offer.lesson_count} ders)
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function StepSummary({
  offeredPlans,
  drafts,
  tutorHourlyPrice,
}: {
  offeredPlans: TutorPackageOffer[];
  drafts: Record<string, DraftOffer>;
  tutorHourlyPrice: number;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Özet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Öğrencilerin göreceği paketler ve fiyatları bunlar. Kaydet&apos;e basana kadar hiçbir şey değişmez.
      </p>
      {offeredPlans.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          Şu an hiçbir paket sunmuyorsun — öğrenciler paket satın alamaz.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {offeredPlans.map((offer) => {
            // Read the discount from the draft, not the originally-fetched
            // offer — a discount edited in Step 2 must show up here, not
            // the stale value from before that edit.
            const discount = drafts[offer.plan_id]?.discount_percent ?? offer.catalog_discount_percent;
            const pricing = calculatePackagePricing(tutorHourlyPrice, offer.lesson_count, discount);
            return (
              <div
                key={offer.plan_id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{planLabel(offer)}</p>
                  <p className="text-xs text-muted-foreground">
                    {offer.lesson_count} ders · %{discount} indirim
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatPrice(pricing.total)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
