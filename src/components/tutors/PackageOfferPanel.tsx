"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createPackagePurchase,
  fetchPackagePlans,
  fetchPackagePurchases,
} from "@/lib/paymentsApi";
import { formatPrice } from "@/lib/utils";
import type { TutorProfile } from "@/types";

interface PackageOfferPanelProps {
  tutor: TutorProfile;
}

/**
 * Compact "buy a lesson package" offer shown on the tutor detail page's
 * sticky CTA card, alongside (never instead of) normal single-lesson
 * booking. Ledger-first: creating a request means "admin approval/payment
 * confirmation pending," not an online charge — pricing shown here mirrors
 * the backend's calculate_package_pricing() formula for an accurate quote,
 * but the purchase itself is only ever activated by an admin.
 */
export function PackageOfferPanel({ tutor }: PackageOfferPanelProps) {
  const queryClient = useQueryClient();

  const { data: plans } = useQuery({
    queryKey: ["package-plans"],
    queryFn: fetchPackagePlans,
  });
  const { data: purchases } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
  });

  const createMutation = useMutation({
    mutationFn: createPackagePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      toast.success(
        "Paket talebin oluşturuldu. Admin onayından sonra ders hakların aktifleşecek."
      );
    },
    onError: () => {
      toast.error("Paket talebi oluşturulamadı. Lütfen tekrar deneyin.");
    },
  });

  const plan = plans?.[0];
  if (!plan) return null;

  const existing = purchases?.find(
    (p) => p.tutor.id === tutor.id && p.plan.id === plan.id
  );

  const hourlyPrice = tutor.hourly_price;
  const subtotal = hourlyPrice * plan.lesson_count;
  const discountAmount = Math.round((subtotal * plan.discount_percent) / 100);
  const total = subtotal - discountAmount;
  const unitPrice = Math.round(total / plan.lesson_count);

  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <p className="font-medium">{plan.lesson_count} derslik avantajlı paket</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {plan.name} · {plan.lesson_duration_minutes} dk/ders
      </p>

      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tek ders ücreti</dt>
          <dd>{formatPrice(hourlyPrice)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Ara toplam ({plan.lesson_count} ders)</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">İndirim (%{plan.discount_percent})</dt>
          <dd>-{formatPrice(discountAmount)}</dd>
        </div>
        <div className="flex justify-between font-medium text-foreground">
          <dt>Paket toplamı</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <dt>Ders başına</dt>
          <dd>{formatPrice(unitPrice)}</dd>
        </div>
      </dl>

      <div className="mt-3 space-y-1.5">
        {existing?.status === "pending" ? (
          <p className="rounded-md bg-background px-2 py-1.5 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
            Admin onayı bekleniyor
          </p>
        ) : existing?.status === "paid" && existing.remaining_credits > 0 ? (
          <p className="rounded-md bg-background px-2 py-1.5 text-center text-xs font-medium text-green-700 dark:text-green-300">
            Kullanılabilir {existing.remaining_credits} ders hakkı
          </p>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => createMutation.mutate({ tutor: tutor.id, plan: plan.id })}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Oluşturuluyor..." : "Paket talebi oluştur"}
          </Button>
        )}
        <Link
          href="/profile/payments"
          className="block text-center text-xs text-muted-foreground hover:underline"
        >
          Paketlerimi görüntüle
        </Link>
      </div>
    </div>
  );
}
