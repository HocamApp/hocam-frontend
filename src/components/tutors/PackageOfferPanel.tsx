"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Gift } from "lucide-react";
import { fetchPackagePlans, fetchPackagePurchases, filterMatrixPlans } from "@/lib/paymentsApi";
import type { TutorProfile } from "@/types";

interface PackageOfferPanelProps {
  tutor: TutorProfile;
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

  // Without a paid or pending package, this panel would just duplicate the
  // main "Ders Rezervasyonu Yap" CTA below it, so render nothing.
  const tutorPurchases = (purchases ?? []).filter((p) => p.tutor.id === tutor.id);
  const paidWithCredits = tutorPurchases.find(
    (p) => p.status === "paid" && p.remaining_credits > 0
  );
  const pending = tutorPurchases.find((p) => p.status === "pending");

  if (!paidWithCredits && !pending) return null;

  const subtitle = paidWithCredits
    ? `Kullanılabilir ${paidWithCredits.remaining_credits} ders hakkı`
    : "Admin onayı bekleniyor";

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
