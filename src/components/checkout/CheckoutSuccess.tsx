"use client";

import Link from "next/link";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { PackagePurchase } from "@/types";

interface PurchaseSuccessProps {
  purchase: PackagePurchase;
  tutorId: string;
}

/** Shown after a package request is created. Deliberately styled as a
 * pending state (amber clock, not a green payment success): no money has
 * moved yet — an admin activates the credits. */
export function CheckoutPurchaseSuccess({ purchase, tutorId }: PurchaseSuccessProps) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="space-y-4 pt-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Paket talebin oluşturuldu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin onayı bekleniyor — onaydan sonra {purchase.total_credits} ders
            hakkın aktifleşecek.
          </p>
        </div>

        <dl className="space-y-2 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Paket</dt>
            <dd className="text-right">{purchase.plan.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Toplam ders</dt>
            <dd>{purchase.total_credits} ders</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Ders başına</dt>
            <dd>{formatPrice(purchase.unit_price)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Ara toplam</dt>
            <dd>{formatPrice(purchase.subtotal_price)}</dd>
          </div>
          {purchase.discount_amount > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">İndirim</dt>
              <dd className="text-green-700 dark:text-green-400">
                -{formatPrice(purchase.discount_amount)}
              </dd>
            </div>
          )}
          {purchase.promo_discount_amount > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                İndirim kodu{purchase.promotion_code ? ` (${purchase.promotion_code})` : ""}
              </dt>
              <dd className="text-green-700 dark:text-green-400">
                -{formatPrice(purchase.promo_discount_amount)}
              </dd>
            </div>
          )}
          <Separator className="!my-3" />
          <div className="flex justify-between gap-4 text-base font-semibold text-foreground">
            <dt>Paket toplamı</dt>
            <dd>{formatPrice(purchase.total_price)}</dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">
          Tek seferlik ödeme — paket otomatik yenilenmez. Kartından anlık ödeme
          alınmaz.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <Link href="/profile/payments">Paketlerimi görüntüle</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/tutors/${tutorId}`}>Hoca profiline dön</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface BookingSuccessProps {
  tutorId: string;
}

/** Shown after a single-lesson booking is created via the BookingModal. */
export function CheckoutBookingSuccess({ tutorId }: BookingSuccessProps) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="space-y-4 pt-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Rezervasyonun oluşturuldu!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hoca onayladığında rezervasyonun kesinleşecek.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <Link href="/dashboard/student">Rezervasyonlarımı gör</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/tutors/${tutorId}`}>Hoca profiline dön</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
