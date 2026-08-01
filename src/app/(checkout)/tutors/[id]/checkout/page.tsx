"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchTutorById } from "@/lib/tutorsApi";
import {
  createPackagePurchase,
  extractPackagePurchaseErrorMessage,
  extractPromoPreviewErrorMessage,
  fetchPackagePurchases,
  fetchTutorOfferedPlans,
  filterMatrixPlans,
  previewPackagePromotion,
} from "@/lib/paymentsApi";
import {
  MOST_POPULAR_DURATION_DAYS,
  calculatePackagePricing,
  normalizeWeeklyLessonOption,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import { BookingModal } from "@/components/lessons/BookingModal";
import { CheckoutProductPicker } from "@/components/checkout/CheckoutProductPicker";
import { CheckoutSummary, type PromoStatus } from "@/components/checkout/CheckoutSummary";
import { CheckoutShell } from "@/components/checkout/CheckoutShell";
import { normalizeCheckoutPalette } from "@/components/checkout/checkoutPalette";
import { MinimalCheckoutHeader } from "@/components/checkout/MinimalCheckoutHeader";
import {
  CheckoutBookingSuccess,
  CheckoutPurchaseSuccess,
} from "@/components/checkout/CheckoutSuccess";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PackagePlan, PackagePurchase, PromoPreviewResponse } from "@/types";

function parseLessonsPerWeek(raw: string | null): WeeklyLessonOption {
  return normalizeWeeklyLessonOption(raw);
}

function parseDurationDays(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : MOST_POPULAR_DURATION_DAYS;
}

type LearningContextQuery = {
  learning_goal_id: string;
  learning_milestone_id: string;
  learning_topic_id?: string | null;
};

function learningContextFromSearchParams(
  searchParams: URLSearchParams
): LearningContextQuery | null {
  const learning_goal_id = searchParams.get("learning_goal_id");
  const learning_milestone_id = searchParams.get("learning_milestone_id");
  const learning_topic_id = searchParams.get("learning_topic_id");
  if (!learning_goal_id || !learning_milestone_id) return null;
  return {
    learning_goal_id,
    learning_milestone_id,
    ...(learning_topic_id ? { learning_topic_id } : {}),
  };
}

export default function TutorCheckoutPage({
  params,
}: {
  params: { id: string };
}) {
  const tutorId = params.id;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checkoutPalette = normalizeCheckoutPalette(searchParams.get("palette"));
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, isStudent, user } = useAuth();

  const [lessonsPerWeek, setLessonsPerWeek] = useState<WeeklyLessonOption>(() =>
    parseLessonsPerWeek(searchParams.get("per_week"))
  );
  const [durationDays, setDurationDays] = useState<number>(() =>
    parseDurationDays(searchParams.get("duration"))
  );
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<PromoStatus>("idle");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoPricing, setPromoPricing] = useState<PromoPreviewResponse | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoPlanId, setPromoPlanId] = useState<string | null>(null);
  const promoRequestId = useRef(0);
  // "credits" books with existing package credits; "trial" is the free
  // intro-lesson path — both reuse the BookingModal.
  const [bookingModalMode, setBookingModalMode] = useState<
    "credits" | "trial" | null
  >(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [createdPurchase, setCreatedPurchase] = useState<PackagePurchase | null>(null);

  const learningContext = learningContextFromSearchParams(
    new URLSearchParams(searchParams.toString())
  );

  // Auth guard: checkout is meaningless anonymously — send to login and come
  // back here with the current selection intact (it lives in the URL).
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const query = searchParams.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(`/login?returnUrl=${encodeURIComponent(target)}`);
    }
  }, [authLoading, isAuthenticated, pathname, searchParams, router]);

  // Keep the selection shareable / login-round-trip-proof in the URL.
  // Old links may still carry package/term params from the retired
  // single-purchase model — drop them.
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("per_week", String(lessonsPerWeek));
    next.set("duration", String(durationDays));
    next.delete("package");
    next.delete("term");
    if (next.toString() !== searchParams.toString()) {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
  }, [lessonsPerWeek, durationDays, pathname, router, searchParams]);

  const {
    data: tutor,
    isLoading: tutorLoading,
    error: tutorError,
  } = useQuery({
    queryKey: ["tutor", tutorId],
    queryFn: () => fetchTutorById(tutorId),
    enabled: isAuthenticated,
  });

  const {
    data: plans,
    isLoading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ["tutor-offered-plans", tutorId],
    queryFn: () => fetchTutorOfferedPlans(tutorId),
    enabled: isAuthenticated,
  });

  const { data: purchases } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
    enabled: isAuthenticated && isStudent,
  });

  const weeklyPlans = useMemo(() => filterMatrixPlans(plans), [plans]);
  const selectedPlan = useMemo(
    () =>
      weeklyPlans.find(
        (p) =>
          p.lessons_per_week === lessonsPerWeek &&
          p.duration_days === durationDays
      ) ?? null,
    [weeklyPlans, lessonsPerWeek, durationDays]
  );

  // Deep links may point at a retired combination or a plan this tutor has
  // switched off. Resolve deterministically to a real offer, preferring the
  // popular 90-day term for the requested weekly cadence.
  useEffect(() => {
    if (plansLoading || weeklyPlans.length === 0 || selectedPlan) return;
    const sameCadence = weeklyPlans
      .filter((plan) => plan.lessons_per_week === lessonsPerWeek)
      .sort((a, b) => (a.duration_days ?? 0) - (b.duration_days ?? 0));
    const fallback =
      sameCadence.find((plan) => plan.duration_days === MOST_POPULAR_DURATION_DAYS) ??
      sameCadence[0] ??
      weeklyPlans[0];
    if (fallback.lessons_per_week != null) {
      setLessonsPerWeek(normalizeWeeklyLessonOption(fallback.lessons_per_week));
    }
    if (fallback.duration_days != null) setDurationDays(fallback.duration_days);
  }, [lessonsPerWeek, plansLoading, selectedPlan, weeklyPlans]);

  const basePrice = tutor?.hourly_price ?? 0;
  // Server-authoritative numbers only: no client-side plan constants exist
  // anymore, so there is nothing to price until the catalog answers.
  const pricing = useMemo(
    () =>
      selectedPlan
        ? calculatePackagePricing(
            basePrice,
            selectedPlan.lesson_count,
            selectedPlan.discount_percent
          )
        : null,
    [basePrice, selectedPlan]
  );

  const tutorPurchases = useMemo(
    () => (purchases ?? []).filter((p) => p.tutor.id === tutorId),
    [purchases, tutorId]
  );
  const pendingForSelectedPlan = Boolean(
    selectedPlan &&
      tutorPurchases.some(
        (p) => p.status === "pending" && p.plan.id === selectedPlan.id
      )
  );
  const otherPendingPlanName =
    tutorPurchases.find(
      (p) => p.status === "pending" && p.plan.id !== selectedPlan?.id
    )?.plan.name ?? null;
  const paidWithCredits = tutorPurchases.find(
    (p) => p.status === "paid" && p.remaining_credits > 0
  );

  const purchaseMutation = useMutation({
    mutationFn: createPackagePurchase,
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      setCreatedPurchase(purchase);
    },
    onError: (err: unknown) => {
      toast.error(extractPackagePurchaseErrorMessage(err));
    },
  });

  const { mutate: runPromoPreview } = useMutation({
    mutationFn: previewPackagePromotion,
  });

  const requestPromoPreview = useCallback(
    (code: string, plan: PackagePlan) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        setPromoStatus("error");
        setPromoMessage("Bir indirim kodu yaz.");
        return;
      }
      const requestId = ++promoRequestId.current;
      setPromoStatus("loading");
      setPromoMessage("Kod doğrulanıyor…");
      setPromoPricing(null);
      runPromoPreview(
        {
          tutor: tutorId,
          plan: plan.id,
          promotion_code: normalized,
        },
        {
          onSuccess: (preview) => {
            if (requestId !== promoRequestId.current) return;
            setPromoCode(preview.promotion_code);
            setAppliedPromoCode(preview.promotion_code);
            setPromoPlanId(plan.id);
            setPromoPricing(preview);
            setPromoStatus("applied");
            setPromoMessage("İndirim kodu uygulandı.");
          },
          onError: (error) => {
            if (requestId !== promoRequestId.current) return;
            setAppliedPromoCode(null);
            setPromoPlanId(null);
            setPromoPricing(null);
            setPromoStatus("error");
            setPromoMessage(extractPromoPreviewErrorMessage(error));
          },
        }
      );
    },
    [runPromoPreview, tutorId]
  );

  useEffect(() => {
    if (!appliedPromoCode || !selectedPlan || promoPlanId === selectedPlan.id) return;
    requestPromoPreview(appliedPromoCode, selectedPlan);
  }, [appliedPromoCode, promoPlanId, requestPromoPreview, selectedPlan]);

  function handlePromoCodeChange(code: string) {
    promoRequestId.current += 1;
    setPromoCode(code);
    setAppliedPromoCode(null);
    setPromoPlanId(null);
    setPromoPricing(null);
    setPromoStatus(code.trim() ? "editing" : "idle");
    setPromoMessage(null);
  }

  function removePromo() {
    promoRequestId.current += 1;
    setPromoCode("");
    setAppliedPromoCode(null);
    setPromoPlanId(null);
    setPromoPricing(null);
    setPromoStatus("idle");
    setPromoMessage(null);
  }

  const isOwnProfile = !!tutor && !!user && user.id === tutor.user;
  const trialLessonsRemaining = tutor?.trial_lessons_remaining ?? 0;
  const canBookFreeTrial =
    !isOwnProfile &&
    tutor?.trial_lesson_eligible === true &&
    trialLessonsRemaining > 0;

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (tutorLoading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (tutorError || !tutor) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ErrorMessage message="Hoca profili yüklenemedi." />
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/tutors">Geri Dön</Link>
        </Button>
      </div>
    );
  }

  if (!isStudent || isOwnProfile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardContent className="space-y-3 pt-6 text-center">
            <p className="font-medium">
              Paket satın almak için öğrenci hesabı gereklidir.
            </p>
            <Button variant="outline" asChild>
              <Link href={`/tutors/${tutorId}`}>Hoca profiline dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const complete = Boolean(createdPurchase || bookingComplete);

  return (
    <>
      <CheckoutShell
        palette={checkoutPalette}
        header={<MinimalCheckoutHeader tutorId={tutorId} />}
        exploration={
          createdPurchase ? (
            <CheckoutPurchaseSuccess purchase={createdPurchase} tutorId={tutorId} />
          ) : bookingComplete ? (
            <CheckoutBookingSuccess tutorId={tutorId} />
          ) : plansLoading ? (
            <div className="space-y-4" aria-label="Paket seçenekleri yükleniyor">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-52 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          ) : plansError ? (
            <div className="rounded-2xl border p-6">
              <ErrorMessage message="Paket seçenekleri yüklenemedi." />
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetchPlans()}>Tekrar dene</Button>
            </div>
          ) : weeklyPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <h2 className="font-semibold">Bu hoca için açık paket bulunmuyor</h2>
              <p className="mt-2 text-sm text-muted-foreground">Hoca profilinden diğer ders seçeneklerini inceleyebilirsin.</p>
              <Button variant="outline" className="mt-5 rounded-xl" asChild><Link href={`/tutors/${tutorId}`}>Hoca profiline dön</Link></Button>
            </div>
          ) : (
            <CheckoutProductPicker
              palette={checkoutPalette}
              basePrice={basePrice}
              weeklyPlans={weeklyPlans}
              lessonsPerWeek={lessonsPerWeek}
              durationDays={durationDays}
              onLessonsPerWeekChange={setLessonsPerWeek}
              onDurationDaysChange={setDurationDays}
              trialLessonsRemaining={canBookFreeTrial ? trialLessonsRemaining : 0}
              paidRemainingCredits={paidWithCredits?.remaining_credits ?? null}
              onBookTrial={() => setBookingModalMode("trial")}
              onUseCredits={() => setBookingModalMode("credits")}
            />
          )
        }
        decision={
          complete || plansLoading || plansError || weeklyPlans.length === 0 ? null : (
            <CheckoutSummary
              tutor={tutor}
              lessonsPerWeek={lessonsPerWeek}
              durationDays={durationDays}
              pricing={pricing}
              planAvailable={Boolean(selectedPlan)}
              promoCode={promoCode}
              onPromoCodeChange={handlePromoCodeChange}
              onApplyPromo={() => selectedPlan && requestPromoPreview(promoCode, selectedPlan)}
              promoStatus={promoStatus}
              promoMessage={promoMessage}
              promoPricing={promoPlanId === selectedPlan?.id ? promoPricing : null}
              onRemovePromo={removePromo}
              onDurationDaysChange={setDurationDays}
              weeklyPlans={weeklyPlans}
              onPurchaseCta={() => {
                if (!selectedPlan) return;
                purchaseMutation.mutate({
                  tutor: tutor.id,
                  plan: selectedPlan.id,
                  ...(appliedPromoCode && promoPlanId === selectedPlan.id ? { promotion_code: appliedPromoCode } : {}),
                });
              }}
              purchasePending={purchaseMutation.isPending}
              pendingForSelectedPlan={pendingForSelectedPlan}
              otherPendingPlanName={otherPendingPlanName}
            />
          )
        }
      />
      <BookingModal
        tutor={tutor}
        isOpen={bookingModalMode !== null}
        isTrial={bookingModalMode === "trial"}
        onClose={() => setBookingModalMode(null)}
        learningContext={learningContext}
        onSuccess={() => {
          setBookingModalMode(null);
          setBookingComplete(true);
          queryClient.invalidateQueries({ queryKey: ["tutor", tutorId] });
          queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
          toast.success("Ders rezervasyonu oluşturuldu.");
        }}
      />
    </>
  );
}
