"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Clock, Gift, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

// Covers both the pre-existing tutor/plan validation messages (previously
// shown with zero detail — the old error handler was a no-arg generic
// toast) and the new promotion_code ones. Matched on the fuller "promotion
// code ..." phrases, not bare "is not active", to avoid colliding with
// "This package plan is not active." sharing that substring.
function translatePackagePurchaseError(message: string): string {
  if (message.includes("not available for package purchase"))
    return "Bu hoca şu anda paket satışına açık değil.";
  if (message.includes("This package plan is not active"))
    return "Bu paket planı artık aktif değil.";
  if (message.includes("promotion code does not exist"))
    return "Bu indirim kodu geçerli değil.";
  if (message.includes("promotion code is not active"))
    return "Bu indirim kodu artık aktif değil.";
  if (message.includes("promotion code is not valid yet"))
    return "Bu indirim kodu henüz geçerli değil.";
  if (message.includes("promotion code has expired"))
    return "Bu indirim kodunun süresi dolmuş.";
  if (message.includes("promotion code has reached its usage limit"))
    return "Bu indirim kodu kullanım limitine ulaşmış.";
  return message;
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
  const [promoCode, setPromoCode] = useState("");
  const [open, setOpen] = useState(false);

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
      setPromoCode("");
      setOpen(false);
    },
    onError: (err: unknown) => {
      const axErr = err as { response?: { data?: unknown } };
      const data = axErr.response?.data;
      let message = "Paket talebi oluşturulamadı. Lütfen tekrar deneyin.";
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (typeof d.detail === "string") message = d.detail;
        else if (Array.isArray(d.non_field_errors) && d.non_field_errors[0])
          message = String(d.non_field_errors[0]);
        else {
          const firstKey = Object.keys(d)[0];
          const val = firstKey ? d[firstKey] : null;
          if (Array.isArray(val) && val[0]) message = String(val[0]);
          else if (typeof val === "string" && val) message = val;
        }
      }
      toast.error(translatePackagePurchaseError(message));
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
  const triggerSubtitle =
    existing?.status === "pending"
      ? "Admin onayı bekleniyor"
      : existing?.status === "paid" && existing.remaining_credits > 0
        ? `Kullanılabilir ${existing.remaining_credits} ders hakkı`
        : `${formatPrice(unitPrice)} / ders`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
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
              {triggerSubtitle}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="w-[calc(100vw-2rem)] p-0 sm:w-80"
      >
        <div className="p-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Gift className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                {plan.lesson_count} derslik avantajlı paket
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {plan.name} · {plan.lesson_duration_minutes} dk/ders
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-2 h-8 w-8"
              aria-label="Paket panelini kapat"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tek ders ücreti</dt>
              <dd>{formatPrice(hourlyPrice)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Ara toplam ({plan.lesson_count} ders)</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">İndirim (%{plan.discount_percent})</dt>
              <dd>-{formatPrice(discountAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 font-semibold text-foreground">
              <dt>Paket toplamı</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-muted-foreground">
              <dt>Ders başına</dt>
              <dd>{formatPrice(unitPrice)}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2">
            {existing?.status === "pending" ? (
              <p className="flex items-center justify-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Admin onayı bekleniyor
              </p>
            ) : existing?.status === "paid" && existing.remaining_credits > 0 ? (
              <p className="flex items-center justify-center gap-1.5 rounded-md bg-green-500/10 px-2 py-2 text-center text-xs font-medium text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Kullanılabilir {existing.remaining_credits} ders hakkı
              </p>
            ) : (
              <>
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="İndirim kodu (opsiyonel)"
                  className="h-9 text-sm"
                  disabled={createMutation.isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    createMutation.mutate({
                      tutor: tutor.id,
                      plan: plan.id,
                      ...(promoCode.trim() ? { promotion_code: promoCode.trim() } : {}),
                    })
                  }
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Oluşturuluyor..." : "Paket talebi oluştur"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Talep admin onayıyla aktifleşir; kartından anlık ödeme alınmaz.
                </p>
              </>
            )}
            <Link
              href="/profile/payments"
              className="block text-center text-xs text-muted-foreground hover:underline"
              onClick={() => setOpen(false)}
            >
              Paketlerimi görüntüle
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
