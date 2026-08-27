"use client";

import type { ReactNode } from "react";
import { Clock, X } from "@phosphor-icons/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { CheckoutPalette } from "./checkoutPalette";

type PlanKey = "private" | "group" | "pro";

const PLAN_LABELS: Record<PlanKey, string> = {
  private: "Birebir",
  group: "Küçük Grup",
  pro: "Hocam Pro",
};

const rows: Array<{ feature: string; private: string; group: string; pro: string }> = [
  { feature: "Canlı ders formatı", private: "Birebir", group: "2–4 kişilik grup", pro: "Birebir" },
  { feature: "Öğrenci sayısı", private: "1 öğrenci", group: "2–4 öğrenci", pro: "1 öğrenci" },
  { feature: "Hoca seçimi", private: "Var", group: "Planlanan", pro: "Var" },
  { feature: "Ders programı", private: "Hoca müsaitliğine göre", group: "Ortak program", pro: "Hoca müsaitliğine göre" },
  { feature: "Paket süresi ve haftalık sıklık", private: "Kişiye özel seçim", group: "Grup için ortak", pro: "Kişiye özel seçim" },
  { feature: "Kişiselleştirilmiş ders", private: "Var", group: "Grup hedeflerine göre · Planlanan", pro: "Var" },
  { feature: "Arkadaşla katılım", private: "Yok", group: "Planlanan", pro: "Yok" },
  { feature: "Otomatik grup eşleşmesi", private: "Yok", group: "Planlanan", pro: "Yok" },
  { feature: "AI soru çözümü", private: "Yok", group: "Yok", pro: "Sınırsız · Planlanan" },
  { feature: "Gerçek hoca soru desteği", private: "Yok", group: "Yok", pro: "Sınırsız · Planlanan" },
  { feature: "Haftalık koçluk", private: "Yok", group: "Yok", pro: "Haftada 1 · Planlanan" },
  { feature: "Aylık gelişim özeti", private: "Yok", group: "Yok", pro: "Planlanan" },
  { feature: "Veli görüşmesi", private: "Yok", group: "Yok", pro: "Haftada 1 hak · Planlanan" },
  { feature: "Talep önceliği", private: "Standart", group: "Standart", pro: "Öncelikli değerlendirme · Planlanan" },
  { feature: "Satın alınabilirlik", private: "Aktif", group: "Yakında", pro: "Yakında" },
];

export function ComparePlansDialog({
  children,
  palette = "01",
}: {
  children: ReactNode;
  palette?: CheckoutPalette;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showClose={false}
        data-checkout-palette={palette}
        className="checkout-dialog-theme flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 border-[var(--checkout-soft-line)] p-0 sm:h-auto sm:max-h-[92dvh] sm:w-[calc(100vw-2rem)] sm:max-w-5xl sm:rounded-modal sm:border"
      >
        <DialogHeader className="border-b border-[var(--checkout-soft-line)] bg-[var(--checkout-header-surface)] px-5 py-5 pr-14 text-left text-[var(--checkout-header-ink)] sm:px-7">
          <DialogTitle className="text-2xl tracking-tight">Planları karşılaştır</DialogTitle>
          <DialogDescription>Bugün kullanabileceğin özellikleri ve üzerinde çalıştığımız planları birlikte gör.</DialogDescription>
        </DialogHeader>
        <DialogClose aria-label="Karşılaştırmayı kapat" className="absolute right-4 top-4 rounded-pill p-2 opacity-65 transition-colors duration-[--duration-state] hover:bg-[var(--checkout-dulline)] hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--checkout-evergreen)]">
          <X className="size-5" weight="regular" aria-hidden="true" />
        </DialogClose>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7">
          <div className="hidden md:block">
            <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--checkout-dialog-surface)]">
                <tr>
                  <th className="w-[31%] border-b border-[var(--checkout-soft-line)] py-4 pr-4 font-semibold">Özellik</th>
                  {(Object.keys(PLAN_LABELS) as PlanKey[]).map((key) => (
                    <th
                      key={key}
                      data-plan={key}
                      className="checkout-compare-plan-head border-b border-[var(--checkout-soft-line)] px-3 py-4 font-semibold"
                    >
                      <span className="inline-flex rounded-pill border border-[var(--checkout-soft-line)] px-3 py-1">{PLAN_LABELS[key]}</span>
                      {key !== "private" && (
                        <Badge className="checkout-compare-badge ml-2 rounded-pill border bg-transparent text-current hover:bg-transparent">
                          Yakında
                        </Badge>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.feature}>
                    <th className="border-b border-[var(--checkout-soft-line)] py-4 pr-4 font-medium">{row.feature}</th>
                    {(Object.keys(PLAN_LABELS) as PlanKey[]).map((key) => (
                      <td key={key} className="border-b border-[var(--checkout-soft-line)] px-3 py-4 opacity-70">
                        <PlannedValue value={row[key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Tabs defaultValue="private" className="md:hidden">
            <TabsList className="grid h-auto w-full grid-cols-3 bg-[var(--checkout-muted-surface)]">
              {(Object.keys(PLAN_LABELS) as PlanKey[]).map((key) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  data-plan={key}
                  className="checkout-compare-tab px-2 py-2.5 text-xs text-[var(--checkout-nighttime)]"
                >
                  {PLAN_LABELS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
            {(Object.keys(PLAN_LABELS) as PlanKey[]).map((key) => (
              <TabsContent key={key} value={key} className="mt-5">
                {key !== "private" && (
                  <Badge
                    data-plan={key}
                    className="checkout-compare-mobile-badge mb-3 rounded-pill border bg-transparent hover:bg-transparent"
                  >
                    Planlanan · Yakında
                  </Badge>
                )}
                <dl className="divide-y divide-[var(--checkout-soft-line)]">
                  {rows.map((row) => (
                    <div key={row.feature} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 py-3.5 text-sm">
                      <dt className="font-medium">{row.feature}</dt>
                      <dd className="text-right opacity-70"><PlannedValue value={row[key]} /></dd>
                    </div>
                  ))}
                </dl>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlannedValue({ value }: { value: string }) {
  const planned = value.includes("Planlanan") || value === "Yakında";
  return (
    <span className="inline-flex items-center gap-1.5">
      {planned && <Clock className="size-3.5 shrink-0" weight="regular" aria-hidden="true" />}
      {value}
    </span>
  );
}
