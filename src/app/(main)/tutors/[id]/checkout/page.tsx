"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchTutorById } from "@/lib/tutorsApi";
import {
  createPackagePurchase,
  extractPackagePurchaseErrorMessage,
  fetchPackagePlans,
  fetchPackagePurchases,
  findTenPackPlan,
} from "@/lib/paymentsApi";
import {
  WEEKLY_LESSON_OPTIONS,
  WEEKLY_TERM_OPTIONS,
  calculatePackagePricing,
  getSingleLessonPrice,
  getTenLessonPackagePrice,
  getWeeklyPackagePrice,
  type WeeklyLessonOption,
  type WeeklyTermOption,
} from "@/lib/lessonPricing";
import { formatPrice } from "@/lib/utils";
import { BookingModal } from "@/components/lessons/BookingModal";
import {
  CheckoutProductPicker,
  type CheckoutPackageType,
} from "@/components/checkout/CheckoutProductPicker";
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

function parsePackageType(raw: string | null): CheckoutPackageType {
  return raw === "ten_pack" || raw === "weekly" ? raw : "single";
}

function parseLessonsPerWeek(raw: string | null): WeeklyLessonOption {
  const n = Number(raw);
  return (WEEKLY_LESSON_OPTIONS as readonly number[]).includes(n)
    ? (n as WeeklyLessonOption)
    : 2;
}

function parseTermMonths(raw: string | null): WeeklyTermOption {
  const n = Number(raw);
  return (WEEKLY_TERM_OPTIONS as readonly number[]).includes(n)
    ? (n as WeeklyTermOption)
    : 1;
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

  const [packageType, setPackageType] = useState<CheckoutPackageType>(() =>
    parsePackageType(searchParams.get("package"))
  );
  const [lessonsPerWeek, setLessonsPerWeek] = useState<WeeklyLessonOption>(() =>
    parseLessonsPerWeek(searchParams.get("per_week"))
  );
  const [termMonths, setTermMonths] = useState<WeeklyTermOption>(() =>
    parseTermMonths(searchParams.get("term"))
  );
  const [promoCode, setPromoCode] = useState("");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
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
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("package", packageType);
    if (packageType === "weekly") {
      next.set("per_week", String(lessonsPerWeek));
      next.set("term", String(termMonths));
    } else {
      next.delete("per_week");
      next.delete("term");
    }
    if (next.toString() !== searchParams.toString()) {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
  }, [packageType, lessonsPerWeek, termMonths, pathname, router, searchParams]);

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

  const tenPackPlan = useMemo(() => findTenPackPlan(plans), [plans]);
  const weeklyPlans = useMemo(
    () =>
      (plans ?? []).filter(
        (p) => p.lessons_per_week != null && p.term_months != null
      ),
    [plans]
  );
  const selectedPlan = useMemo(() => {
    if (packageType === "ten_pack") return tenPackPlan ?? null;
    if (packageType === "weekly")
      return (
        weeklyPlans.find(
          (p) =>
            p.lessons_per_week === lessonsPerWeek && p.term_months === termMonths
        ) ?? null
      );
    return null;
  }, [packageType, tenPackPlan, weeklyPlans, lessonsPerWeek, termMonths]);

  const basePrice = tutor?.hourly_price ?? 0;
  const pricing = useMemo(() => {
    if (packageType === "single") return getSingleLessonPrice(basePrice);
    // Prefer the actual catalog plan's numbers (server-authoritative); the
    // helper constants are only the fallback while plans load.
    if (selectedPlan)
      return calculatePackagePricing(
        basePrice,
        selectedPlan.lesson_count,
        selectedPlan.discount_percent
      );
    return packageType === "ten_pack"
      ? getTenLessonPackagePrice(basePrice)
      : getWeeklyPackagePrice(basePrice, lessonsPerWeek, termMonths);
  }, [packageType, basePrice, selectedPlan, lessonsPerWeek, termMonths]);

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
        Tek ders al veya peşin ders paketiyle ders başına avantaj kazan.
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
          <div className="lg:col-span-2">
            <CheckoutProductPicker
              basePrice={basePrice}
              tenPackPlan={tenPackPlan}
              weeklyPlans={weeklyPlans}
              packageType={packageType}
              lessonsPerWeek={lessonsPerWeek}
              termMonths={termMonths}
              onPackageTypeChange={setPackageType}
              onLessonsPerWeekChange={setLessonsPerWeek}
              onTermMonthsChange={setTermMonths}
            />
          </div>
          <div>
            <div className="lg:sticky lg:top-24">
              <CheckoutSummary
                tutor={tutor}
                packageType={packageType}
                lessonsPerWeek={lessonsPerWeek}
                termMonths={termMonths}
                pricing={pricing}
                planAvailable={packageType === "single" || !!selectedPlan}
                promoCode={promoCode}
                onPromoCodeChange={setPromoCode}
                onSingleLessonCta={() => setBookingModalOpen(true)}
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
                onUseCredits={() => setBookingModalOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      <BookingModal
        tutor={tutor}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        learningContext={learningContext}
        onSuccess={() => {
          setBookingModalOpen(false);
          setBookingComplete(true);
          queryClient.invalidateQueries({ queryKey: ["tutor", tutorId] });
          queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
          toast.success("Ders rezervasyonu oluşturuldu.");
        }}
      />
    </div>
  );
}
