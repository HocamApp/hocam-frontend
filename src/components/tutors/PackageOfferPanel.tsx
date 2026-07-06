"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Gift } from "lucide-react";
import { fetchPackagePlans, fetchPackagePurchases, findTenPackPlan } from "@/lib/paymentsApi";
import { calculatePackagePricing } from "@/lib/lessonPricing";
import { formatPrice } from "@/lib/utils";
import type { TutorProfile } from "@/types";

interface PackageOfferPanelProps {
  tutor: TutorProfile;
}

/**
 * Compact teaser for lesson packages on the tutor detail page's sticky CTA
 * card. The actual purchase (all package types, promo code, pricing
 * breakdown) lives on /tutors/[id]/checkout — this row just advertises the
 * classic 10-pack and reflects the student's current purchase state with
 * this tutor.
 */
export function PackageOfferPanel({ tutor }: PackageOfferPanelProps) {
  const { data: plans } = useQuery({
    queryKey: ["package-plans"],
    queryFn: fetchPackagePlans,
  });
  const { data: purchases } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
  });

  const plan = findTenPackPlan(plans);
  if (!plan) return null;

  // Any plan counts here — a paid weekly package or a pending 10-pack both
  // matter more to the student than the generic price teaser. Paid credits
  // win over a pending request.
  const tutorPurchases = (purchases ?? []).filter((p) => p.tutor.id === tutor.id);
  const paidWithCredits = tutorPurchases.find(
    (p) => p.status === "paid" && p.remaining_credits > 0
  );
  const pending = tutorPurchases.find((p) => p.status === "pending");

  const pricing = calculatePackagePricing(
    tutor.hourly_price,
    plan.lesson_count,
    plan.discount_percent
  );
  const subtitle = paidWithCredits
    ? `Kullanılabilir ${paidWithCredits.remaining_credits} ders hakkı`
    : pending
      ? "Admin onayı bekleniyor"
      : `${formatPrice(pricing.discountedPerLesson)} / ders`;

  return (
    <Link
      href={`/tutors/${tutor.id}/checkout?package=ten_pack`}
      className="flex w-full items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`${plan.lesson_count} derslik avantajlı paket`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Gift className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {plan.lesson_count} derslik avantajlı paket
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
