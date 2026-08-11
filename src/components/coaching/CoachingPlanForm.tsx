"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { cn } from "@/lib/utils";
import { formatTryMinor } from "@/lib/money";
import type {
  CoachingFrequency,
  CoachingPlan,
  CoachingPlanPayload,
} from "@/lib/coachingApi";

const FREQUENCIES: { value: CoachingFrequency; label: string; hint: string }[] = [
  { value: "biweekly", label: "İki haftada 1", hint: "14 günde bir görüşme" },
  { value: "weekly", label: "Haftada 1", hint: "Her hafta bir görüşme" },
  { value: "twice_weekly", label: "Haftada 2", hint: "Ana görüşme + ara kontrol" },
];

const EXAM_TYPES = [
  { value: "TYT", label: "TYT" },
  { value: "AYT", label: "AYT" },
  { value: "YDT", label: "YDT" },
  { value: "DGS", label: "DGS" },
  { value: "KPSS", label: "KPSS" },
];

const DESCRIPTION_MAX = 500;

/**
 * The coaching plan form.
 *
 * Session length is shown but not editable — 30 minutes is fixed by the
 * product, and the backend marks the field read-only regardless. Price is
 * entered in lira for comfort and converted to kuruş at the boundary; all
 * arithmetic beyond that point happens server-side.
 */
export function CoachingPlanForm({
  plan,
  priceCapMinor,
  onSubmit,
  isSaving,
  error,
}: {
  plan: CoachingPlan | null;
  priceCapMinor: number | null;
  onSubmit: (payload: CoachingPlanPayload) => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [frequency, setFrequency] = useState<CoachingFrequency>(
    plan?.frequency ?? "weekly"
  );
  const [priceLira, setPriceLira] = useState(
    plan ? String(plan.price_per_session_minor / 100) : ""
  );
  const [maxStudents, setMaxStudents] = useState(
    String(plan?.max_active_students ?? 3)
  );
  const [examTypes, setExamTypes] = useState<string[]>(
    plan?.target_exam_types ?? []
  );
  const [description, setDescription] = useState(plan?.description ?? "");

  const priceMinor = Math.round(Number(priceLira || 0) * 100);
  const overCap = priceCapMinor !== null && priceMinor > priceCapMinor;

  const toggleExamType = (value: string) => {
    setExamTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      frequency,
      price_per_session_minor: priceMinor,
      max_active_students: Number(maxStudents || 1),
      target_exam_types: examTypes,
      description,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? <ErrorMessage message={error} /> : null}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <fieldset>
            <legend className="text-sm font-medium">Görüşme sıklığı</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {FREQUENCIES.map((option) => {
                const selected = frequency === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFrequency(option.value)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <Label>Görüşme süresi</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              30 dakika — bütün koçluk görüşmeleri için sabittir.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label htmlFor="coaching-price">Görüşme başına fiyat (₺)</Label>
            <Input
              id="coaching-price"
              type="number"
              min={0}
              step="0.01"
              value={priceLira}
              onChange={(event) => setPriceLira(event.target.value)}
              aria-describedby="coaching-price-hint"
              className="mt-1"
            />
            <p id="coaching-price-hint" className="mt-1 text-xs text-muted-foreground">
              {priceCapMinor !== null ? (
                <>
                  Üst sınır {formatTryMinor(priceCapMinor)} — 40 dakikalık ders
                  fiyatının %75&apos;i. Ücretsiz koçluk için 0 girebilirsin.
                </>
              ) : (
                "Ücretsiz koçluk için 0 girebilirsin."
              )}
            </p>
            {overCap ? (
              <p className="mt-1 text-xs text-destructive">
                Bu fiyat üst sınırı aşıyor.
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="coaching-capacity">En fazla aktif koçluk öğrencisi</Label>
            <Input
              id="coaching-capacity"
              type="number"
              min={1}
              value={maxStudents}
              onChange={(event) => setMaxStudents(event.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Müsaitliğinin kaldırabileceğinden fazlasını seçemezsin; bu kontrol
              plan yayınlanırken yapılır.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <fieldset>
            <legend className="text-sm font-medium">Hedef sınav grupları</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAM_TYPES.map((option) => {
                const selected = examTypes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleExamType(option.value)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <Label htmlFor="coaching-description">
              Kısa kişisel açıklama (isteğe bağlı)
            </Label>
            <Textarea
              id="coaching-description"
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-1"
              placeholder="Öğrencilerime sürdürülebilir çalışma düzeni ve deneme analizi konusunda destek oluyorum."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {description.length}/{DESCRIPTION_MAX}. Platform dışı iletişim,
              sınırsız soru çözümü veya sınav sonucu garantisi gibi vaatler
              kabul edilmez.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Kaydediliyor…" : "Planı kaydet"}
      </Button>
    </form>
  );
}
