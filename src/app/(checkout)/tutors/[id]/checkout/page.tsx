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
import {
  createCoachingHold,
  extractCoachingErrorMessage,
  fetchCoachingEligibility,
  readCoachingSelectedFromSearchParams,
  type CoachingQuote,
} from "@/lib/coachingApi";
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
  // Coaching selection rides in the URL like the package selection does,
  // so it survives the login round-trip and a shared link.
  const coachingSelected = readCoachingSelectedFromSearchParams(searchParams);
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
    // `coaching` is deliberately left untouched here — it is owned by the
    // choice step and the "Düzenle" link, not by this effect.
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

  // Eligibility is per-student and uncached; the coaching row only renders
  // when the server says this student can actually buy it.
  const { data: coachingEligibility } = useQuery({
    queryKey: ["coaching-eligibility", tutorId],
    queryFn: () => fetchCoachingEligibility(tutorId),
    enabled: isAuthenticated && isStudent && coachingSelected,
  });

  const coachingAvailable = Boolean(
    coachingSelected && coachingEligibility?.eligible
  );

  // The student asked for coaching and the server says no — an active
  // coach, a full plan, a mismatched exam. Lesson-only is the right
  // outcome, but it must be stated: arriving here after a login round-trip
  // and finding coaching quietly missing looks like the site lost it.
  const coachingUnavailableMessage =
    coachingSelected &&
    coachingEligibility &&
    !coachingEligibility.eligible &&
    coachingEligibility.message
      ? coachingEligibility.message
      : null;

  const [coachingQuote, setCoachingQuote] = useState<CoachingQuote | null>(null);
  const [coachingHoldExpiresAt, setCoachingHoldExpiresAt] = useState<string | null>(
    null
  );
  const [coachingHoldError, setCoachingHoldError] = useState<string | null>(null);
  // Set when the server rejected the submit because the price moved. Blocks
  // the CTA until the student explicitly accepts the new number, so a
  // second click cannot buy at a price they never agreed to.
  const [coachingPriceChanged, setCoachingPriceChanged] = useState(false);
  // Bumped when the student accepts a new price. It is a dependency of the
  // hold effect on purpose: clearing the banner is not enough, because the
  // SERVER's hold still carries the old fingerprint and would reject the
  // next submit for the same reason. Accepting has to re-quote.
  const [coachingQuoteNonce, setCoachingQuoteNonce] = useState(0);

  // The student asked for coaching AND the server has actually quoted and
  // held it. Only this may put `coaching` on the request.
  //
  // `coachingAvailable` is NOT enough: it says the student is eligible, not
  // that a hold exists. If the hold call fails, the summary falls back to
  // lesson-only numbers — sending the coaching flag anyway would create a
  // bundle the student was never shown a price for.
  const coachingReady = coachingAvailable && coachingQuote !== null;
  const coachingBlocked = coachingAvailable && coachingQuote === null;

  // The hold is taken HERE, not on the choice screen: the quote depends on
  // package duration and weekly-lesson count, which are only settled once
  // the student is on this page. Re-quoting reuses the same server row and
  // never extends the 15-minute window.
  useEffect(() => {
    if (!coachingAvailable || !selectedPlan) {
      setCoachingQuote(null);
      setCoachingHoldExpiresAt(null);
      setCoachingHoldError(null);
      return;
    }
    let cancelled = false;
    const storageKey = `coaching-hold-key:${tutorId}`;
    let idempotencyKey = sessionStorage.getItem(storageKey);
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID();
      sessionStorage.setItem(storageKey, idempotencyKey);
    }

    createCoachingHold({
      tutorId,
      durationDays,
      lessonsPerWeek,
      idempotencyKey,
    })
      .then(({ hold, quote }) => {
        if (cancelled) return;
        setCoachingQuote(quote);
        // Countdown source is the server's expiry, never a local timer.
        setCoachingHoldExpiresAt(hold.expires_at);
        setCoachingHoldError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCoachingQuote(null);
        setCoachingHoldExpiresAt(null);
        // Kept in state, not only in a toast: a toast disappears while the
        // summary still shows lesson-only numbers, and the student has no
        // way to tell that the coaching they picked did not make it in.
        setCoachingHoldError(extractCoachingErrorMessage(err));
      });

    return () => {
      cancelled = true;
    };
  }, [
    coachingAvailable,
    selectedPlan,
    tutorId,
    durationDays,
    lessonsPerWeek,
    coachingQuoteNonce,
  ]);

  const purchaseMutation = useMutation({
    mutationFn: createPackagePurchase,
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      setCreatedPurchase(purchase);
    },
    onError: (err: unknown) => {
      // The server refuses a bundle whose price moved since the quote and
      // hands back the current one (409 price_changed). Show the new
      // numbers and make the student confirm them — do not retry silently,
      // and do not leave the old total on screen.
      const response = (
        err as {
          response?: { status?: number; data?: Record<string, unknown> };
        }
      ).response;
      const data = response?.data;
      if (response?.status === 409 && data?.code === "price_changed") {
        const fresh = data.coaching_quote as CoachingQuote | undefined;
        if (fresh) setCoachingQuote(fresh);
        setCoachingPriceChanged(true);
        toast.error(
          typeof data.detail === "string"
            ? data.detail
            : "Koçluk fiyatı değişti. Yeni tutarı onayla."
        );
        return;
      }
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
              <Skeleton className="h-24 rounded-card" />
              <Skeleton className="h-52 rounded-card" />
              <Skeleton className="h-24 rounded-card" />
            </div>
          ) : plansError ? (
            <div className="rounded-card border border-[var(--checkout-soft-line)] bg-[var(--checkout-card-surface)] p-6">
              <ErrorMessage message="Paket seçenekleri yüklenemedi." />
              <Button variant="outline" className="mt-4 rounded-pill" onClick={() => refetchPlans()}>Tekrar dene</Button>
            </div>
          ) : weeklyPlans.length === 0 ? (
            <div className="rounded-card border border-[var(--checkout-soft-line)] bg-[var(--checkout-card-surface)] p-8 text-center">
              <h2 className="font-semibold">Bu hoca için açık paket bulunmuyor</h2>
              <p className="mt-2 text-sm text-muted-foreground">Hoca profilinden diğer ders seçeneklerini inceleyebilirsin.</p>
              <Button variant="outline" className="mt-5 rounded-pill" asChild><Link href={`/tutors/${tutorId}`}>Hoca profiline dön</Link></Button>
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
                // Refuse rather than guess: coaching was chosen but has
                // no live quote, so neither answer is safe — sending it
                // buys an unpriced bundle, dropping it silently buys
                // less than was chosen.
                if (coachingBlocked) return;
                if (coachingPriceChanged) return;
                purchaseMutation.mutate({
                  tutor: tutor.id,
                  plan: selectedPlan.id,
                  ...(appliedPromoCode && promoPlanId === selectedPlan.id ? { promotion_code: appliedPromoCode } : {}),
                  // The server re-derives duration/per-week from the plan
                  // and re-checks the quote; this flag only says "the
                  // student wants coaching too".
                  ...(coachingReady ? { coaching: {} } : {}),
                });
              }}
              purchasePending={purchaseMutation.isPending}
              pendingForSelectedPlan={pendingForSelectedPlan}
              otherPendingPlanName={otherPendingPlanName}
              paidRemainingCredits={paidWithCredits?.remaining_credits ?? null}
              onUseCredits={() => setBookingModalMode("credits")}
              coachingQuote={coachingReady ? coachingQuote : null}
              coachingBlockedMessage={
                coachingBlocked
                  ? coachingHoldError ??
                    "Koçluk kontenjanı şu anda doğrulanamadı."
                  : null
              }
              coachingHoldExpiresAt={coachingHoldExpiresAt}
              coachingUnavailableMessage={coachingUnavailableMessage}
              coachingPriceChanged={coachingPriceChanged}
              onAcceptNewCoachingPrice={() => {
                setCoachingPriceChanged(false);
                setCoachingQuoteNonce((n) => n + 1);
              }}
              coachingEditHref={`/tutors/${tutorId}/checkout/coaching?${searchParams.toString()}`}
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
