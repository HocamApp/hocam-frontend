"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gift } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchTutorById } from "@/lib/tutorsApi";
import {
  createPackagePurchase,
  extractPackagePurchaseErrorMessage,
  fetchPackagePlans,
  fetchPackagePurchases,
  filterMatrixPlans,
} from "@/lib/paymentsApi";
import {
  MOST_POPULAR_DURATION_DAYS,
  WEEKLY_LESSON_OPTIONS,
  calculatePackagePricing,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import { formatPrice } from "@/lib/utils";
import { BookingModal } from "@/components/lessons/BookingModal";
import { CheckoutProductPicker } from "@/components/checkout/CheckoutProductPicker";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import {
  CheckoutBookingSuccess,
  CheckoutPurchaseSuccess,
} from "@/components/checkout/CheckoutSuccess";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PackagePurchase } from "@/types";

function getInitials(name: string, surname: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase() || "?";
}

function parseLessonsPerWeek(raw: string | null): WeeklyLessonOption {
  const n = Number(raw);
  return (WEEKLY_LESSON_OPTIONS as readonly number[]).includes(n)
    ? (n as WeeklyLessonOption)
    : 2;
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
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, isStudent, user } = useAuth();

  const [lessonsPerWeek, setLessonsPerWeek] = useState<WeeklyLessonOption>(() =>
    parseLessonsPerWeek(searchParams.get("per_week"))
  );
  const [durationDays, setDurationDays] = useState<number>(() =>
    parseDurationDays(searchParams.get("duration"))
  );
  const [promoCode, setPromoCode] = useState("");
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

  const { data: plans } = useQuery({
    queryKey: ["package-plans"],
    queryFn: fetchPackagePlans,
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/tutors/${tutorId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Hoca profiline dön
        </Link>
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={tutor.profile_picture || "/images/demo-teacher.jpg"}
              alt={`${tutor.name} ${tutor.surname}`}
            />
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              {getInitials(tutor.name, tutor.surname)}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm leading-tight">
            <p className="font-medium">
              {tutor.name} {tutor.surname}
            </p>
            <p className="text-muted-foreground">
              {formatPrice(tutor.hourly_price)} / 40 dk
            </p>
          </div>
        </div>
      </div>

      <h1 className="mt-6 text-2xl font-bold">Ders paketini seç</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Haftalık ders sayısını ve paket süresini seç, ders başına avantaj
        kazan.
      </p>

      {createdPurchase ? (
        <div className="mt-8">
          <CheckoutPurchaseSuccess purchase={createdPurchase} tutorId={tutorId} />
        </div>
      ) : bookingComplete ? (
        <div className="mt-8">
          <CheckoutBookingSuccess tutorId={tutorId} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {canBookFreeTrial && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Gift className="h-4 w-4" />
                </span>
                <div className="min-w-[14rem] flex-1">
                  <p className="text-sm font-medium">
                    Bu hocayı hiç denemediyseniz önce ücretsiz tanışma dersi
                    alın
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bu ay {trialLessonsRemaining} ücretsiz deneme hakkın kaldı.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setBookingModalMode("trial")}
                >
                  Ücretsiz dersi ayarla
                </Button>
              </div>
            )}
            <CheckoutProductPicker
              basePrice={basePrice}
              weeklyPlans={weeklyPlans}
              lessonsPerWeek={lessonsPerWeek}
              durationDays={durationDays}
              onLessonsPerWeekChange={setLessonsPerWeek}
              onDurationDaysChange={setDurationDays}
            />
          </div>
          <div>
            <div className="lg:sticky lg:top-24">
              <CheckoutSummary
                tutor={tutor}
                lessonsPerWeek={lessonsPerWeek}
                durationDays={durationDays}
                pricing={pricing}
                planAvailable={!!selectedPlan}
                promoCode={promoCode}
                onPromoCodeChange={setPromoCode}
                onPurchaseCta={() => {
                  if (!selectedPlan) return;
                  purchaseMutation.mutate({
                    tutor: tutor.id,
                    plan: selectedPlan.id,
                    ...(promoCode.trim()
                      ? { promotion_code: promoCode.trim() }
                      : {}),
                  });
                }}
                purchasePending={purchaseMutation.isPending}
                pendingForSelectedPlan={pendingForSelectedPlan}
                otherPendingPlanName={otherPendingPlanName}
                paidRemainingCredits={paidWithCredits?.remaining_credits ?? null}
                onUseCredits={() => setBookingModalMode("credits")}
              />
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
