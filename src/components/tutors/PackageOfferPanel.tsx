"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Gift } from "lucide-react";
import { fetchPackagePlans, fetchPackagePurchases, filterMatrixPlans } from "@/lib/paymentsApi";
import { formatPrice } from "@/lib/utils";
import type { TutorProfile } from "@/types";

interface PackageOfferPanelProps {
  tutor: TutorProfile;
}

// Dative suffix ("-e/-a varan") follows the vowel of the number's final
// spoken word: 29 → "dokuza" → 'a, 25 → "beşe" → 'e.
const DATIVE_BY_LAST_DIGIT = ["", "'e", "'ye", "'e", "'e", "'e", "'ya", "'ye", "'e", "'a"];
const DATIVE_BY_TENS = ["", "'a", "'ye", "'a", "'a", "'ye", "'a", "'e", "'e", "'a"];

function withDativeSuffix(n: number): string {
  const suffix =
    n % 10 !== 0
      ? DATIVE_BY_LAST_DIGIT[n % 10]
      : n % 100 !== 0
        ? DATIVE_BY_TENS[Math.floor(n / 10) % 10]
        : "'e"; // yüze
  return `${n}${suffix}`;
}

/**
 * Compact teaser for lesson packages on the tutor detail page's sticky CTA
 * card. The actual purchase (weekly matrix, promo code, pricing breakdown)
 * lives on /tutors/[id]/checkout — this row just advertises the packages
 * and reflects the student's current purchase state with this tutor.
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

  const weeklyPlans = filterMatrixPlans(plans);
  if (weeklyPlans.length === 0) return null;

  // Any plan counts here — a paid package or a pending request both matter
  // more to the student than the generic price teaser. Paid credits win
  // over a pending request.
  const tutorPurchases = (purchases ?? []).filter((p) => p.tutor.id === tutor.id);
  const paidWithCredits = tutorPurchases.find(
    (p) => p.status === "paid" && p.remaining_credits > 0
  );
  const pending = tutorPurchases.find((p) => p.status === "pending");

  const maxDiscount = Math.max(...weeklyPlans.map((p) => p.discount_percent));
  const subtitle = paidWithCredits
    ? `Kullanılabilir ${paidWithCredits.remaining_credits} ders hakkı`
    : pending
      ? "Admin onayı bekleniyor"
      : maxDiscount > 0
        ? `${formatPrice(tutor.hourly_price)} / ders · %${withDativeSuffix(maxDiscount)} varan avantaj`
        : `${formatPrice(tutor.hourly_price)} / ders`;

  return (
    <Link
      href={`/tutors/${tutor.id}/checkout`}
      className="flex w-full items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Haftalık ders paketleri"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Gift className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          Haftalık ders paketleri
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
