"use client";

import { useState } from "react";
import { ArrowRight, Check, Clock3, Info, Target } from "lucide-react";

import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  CoachingCapacityDetail,
  CoachingFrequency,
  CoachingPlan,
  CoachingPlanPayload,
  CoachingSetupConfig,
} from "@/lib/coachingApi";
import { isCoachingExamGroup } from "@/lib/coachingPresentation";
import { formatTryMinor } from "@/lib/money";
import {
  buildCoachingPlanPayload,
  COACHING_SETUP_STEPS,
  type CoachingSetupStep,
} from "@/lib/coachingSetup";
import { cn } from "@/lib/utils";
import { CapacityPreviewCard } from "./CapacityPreviewCard";

const DESCRIPTION_MAX = 500;

const EXAM_CONTEXT: Record<string, string> = {
  YKS: "TYT, AYT ve YDT hedeflerini birlikte kapsar.",
  DGS: "Ön lisans sonrası lisans geçişi için çalışma ritmi kurar.",
  KPSS: "Kamu sınavı hazırlığını plan ve takip odağında destekler.",
};

export function CoachingPlanForm({
  plan,
  setupConfig,
  currentStep,
  capacity,
  onSubmit,
  onContinue,
  isSaving,
  error,
}: {
  plan: CoachingPlan | null;
  setupConfig: CoachingSetupConfig;
  currentStep: CoachingSetupStep;
  capacity: CoachingCapacityDetail | null;
  onSubmit: (payload: CoachingPlanPayload, nextStep: CoachingSetupStep) => void;
  onContinue: (nextStep: CoachingSetupStep) => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [frequency, setFrequency] = useState<CoachingFrequency>(
    plan?.frequency ?? setupConfig.frequency_options[0]?.value ?? "weekly"
  );
  const [priceLira, setPriceLira] = useState(
    String((plan?.price_per_session_minor ?? 0) / 100)
  );
  const [maxStudents, setMaxStudents] = useState(
    String(plan?.max_active_students ?? Math.max(1, capacity?.max_active_students ?? 1))
  );
  const [examTypes, setExamTypes] = useState<string[]>(
    (plan?.target_exam_types ?? []).filter(isCoachingExamGroup)
  );
  const [description, setDescription] = useState(plan?.description ?? "");

  const priceMinor = Math.round(Number(priceLira || 0) * 100);
  const overCap = priceMinor > setupConfig.price_cap_minor;
  const nextStep = COACHING_SETUP_STEPS[
    Math.min(COACHING_SETUP_STEPS.length - 1, COACHING_SETUP_STEPS.indexOf(currentStep) + 1)
  ];

  const draft = () =>
    buildCoachingPlanPayload({
      frequency,
      priceMinor,
      maxActiveStudents: Number(maxStudents || 1),
      examTypes,
      description,
    });

  const advance = () => {
    const requiresSave = Boolean(plan) || currentStep === "description" || currentStep === "capacity";
    if (requiresSave) onSubmit(draft(), nextStep);
    else onContinue(nextStep);
  };

  const toggleExamType = (value: string) => {
    setExamTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  return (
    <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-200">
      {error ? <ErrorMessage message={error} /> : null}

      {currentStep === "frequency" ? (
        <StepCard
          title="Görüşme düzenin nasıl olsun?"
          description="Bu seçim her öğrencinin ders paketi boyunca kaç koçluk görüşmesi alacağını belirler. Sayılar sunucudaki güncel paket modelinden gelir."
        >
          <fieldset>
            <legend className="sr-only">Görüşme düzeni</legend>
            <div className="grid gap-3 lg:grid-cols-3">
              {setupConfig.frequency_options.map((option) => {
                const selected = frequency === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFrequency(option.value)}
                    className={cn(
                      "relative rounded-2xl border-2 p-5 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected
                        ? "border-primary bg-primary/[0.055] shadow-[0_16px_40px_-34px_hsl(var(--primary)/0.7)]"
                        : "border-border/70 bg-card hover:border-foreground/25 hover:bg-muted/20"
                    )}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="block text-lg font-semibold">{option.label}</span>
                      {selected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                          <Check aria-hidden="true" className="h-3 w-3" />
                          Seçili düzen
                        </span>
                      ) : (
                        <span aria-hidden="true" className="h-5 w-5 rounded-full border-2 border-border" />
                      )}
                    </span>
                    <span className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
                      {option.packages.map((item) => (
                        <span key={item.duration_days} className="flex justify-between gap-3">
                          <span>{item.weeks} haftada</span>
                          <span className="font-medium text-foreground">{item.total_sessions} görüşme</span>
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <FixedDuration minutes={setupConfig.session_duration_minutes} />
        </StepCard>
      ) : null}

      {currentStep === "price" ? (
        <StepCard
          title="Koçluk görüşme fiyatın"
          description="Koçluk, 40 dakikalık ders fiyatına bağlı bir ek hizmettir. Fiyat kuralı ve tavan sunucudaki güncel ayardan gelir."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <PolicyValue label="40 dk ders fiyatın" value={formatTryMinor(setupConfig.lesson_price_minor)} />
            <PolicyValue label="Koçluk fiyat tavanı" value={`%${setupConfig.max_price_ratio_percent}`} />
            <PolicyValue label="Girebileceğin en yüksek fiyat" value={formatTryMinor(setupConfig.price_cap_minor)} />
          </div>
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:p-5">
          <div className="max-w-sm">
            <Label htmlFor="coaching-price">Görüşme başına fiyat (₺)</Label>
            <Input
              id="coaching-price"
              type="number"
              min={0}
              max={setupConfig.price_cap_minor / 100}
              step="0.01"
              value={priceLira}
              onChange={(event) => setPriceLira(event.target.value)}
              aria-describedby="coaching-price-hint"
              className="mt-1"
            />
            <p id="coaching-price-hint" className="mt-2 text-xs leading-5 text-muted-foreground">
              Ücretsiz sunmak için 0 girebilirsin. Güncel platform komisyonu %{setupConfig.commission_bps / 100}; paket indirimi ve tahmini net kazanç kayıtlı plan üzerinden sunucuda hesaplanır.
            </p>
            {overCap ? <p className="mt-2 text-xs font-medium text-destructive">Bu fiyat {formatTryMinor(setupConfig.price_cap_minor)} üst sınırını aşıyor.</p> : null}
          </div>
          </div>
        </StepCard>
      ) : null}

      {currentStep === "exams" ? (
        <StepCard
          title="Koçluk verdiğin sınavlar"
          description="Öğrenciler teklifini hedef sınav grubuna göre görür. TYT, AYT ve YDT bu alanda ayrı seçenek değildir; YKS grubunun içindedir."
        >
          <fieldset>
            <legend className="sr-only">Hedef sınav grupları</legend>
            <div className="grid gap-3 md:grid-cols-3">
              {setupConfig.exam_groups.filter(isCoachingExamGroup).map((exam) => {
                const selected = examTypes.includes(exam);
                return (
                  <button
                    key={exam}
                    type="button"
                    aria-label={exam}
                    aria-pressed={selected}
                    onClick={() => toggleExamType(exam)}
                    className={cn(
                      "relative min-h-40 rounded-2xl border-2 p-5 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected
                        ? "border-primary bg-primary/[0.055] shadow-[0_16px_40px_-34px_hsl(var(--primary)/0.7)]"
                        : "border-border/70 bg-card hover:border-foreground/25 hover:bg-muted/20"
                    )}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                        <Target aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold",
                        selected ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground"
                      )}>
                        {selected ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                        {selected ? "Seçildi" : "Seç"}
                      </span>
                    </span>
                    <span className="mt-5 block text-xl font-semibold tracking-tight">{exam}</span>
                    <span className="mt-2 block text-sm font-normal leading-6 text-muted-foreground">
                      {EXAM_CONTEXT[exam]}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </StepCard>
      ) : null}

      {currentStep === "description" ? (
        <StepCard
          title="Öğrenciye kısa bir açıklama yaz"
          description="Nasıl bir çalışma düzeni kurduğunu sade ve somut biçimde anlat. Bu alan isteğe bağlıdır."
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="rounded-2xl border bg-background p-4 sm:p-5">
            <Label htmlFor="coaching-description">Kısa açıklama</Label>
            <Textarea
              id="coaching-description"
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="mt-1"
              placeholder="Öğrencilerime sürdürülebilir çalışma düzeni ve deneme analizi konusunda destek oluyorum."
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {description.length}/{DESCRIPTION_MAX}. Platform dışı iletişim, sınırsız destek veya sınav sonucu garantisi gibi vaatler kullanma.
            </p>
          </div>
          <aside className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 text-sm">
            <p className="font-semibold">İyi bir açıklama ne söyler?</p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
              <li>· Nasıl bir çalışma düzeni kurduğunu</li>
              <li>· Görüşmelerde neyi takip ettiğini</li>
              <li>· Öğrencinin süreçte ne bekleyebileceğini</li>
            </ul>
          </aside>
          </div>
        </StepCard>
      ) : null}

      {currentStep === "capacity" ? (
        <StepCard
          title="Kaç öğrenciyle çalışmak istiyorsun?"
          description="Müsaitliğin önce haftalık slotlara, ardından seçtiğin görüşme düzenine göre teorik kapasiteye çevrilir. Kaydetme sırasında backend’in mevcut kapasite kuralları geçerlidir."
        >
          {capacity ? <CapacityPreviewCard capacity={capacity} /> : null}
          <div className="max-w-sm">
            <Label htmlFor="coaching-capacity">En fazla aktif koçluk öğrencisi</Label>
            <Input
              id="coaching-capacity"
              type="number"
              min={1}
              max={capacity?.theoretical_capacity || undefined}
              value={maxStudents}
              onChange={(event) => setMaxStudents(event.target.value)}
              className="mt-1"
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Sunucu bu değeri mevcut aktif yük ve müsaitlik semantiğine göre doğrular. Kabul edilmezse kayıtlı değer korunur ve sunucu mesajı burada gösterilir.
            </p>
          </div>
        </StepCard>
      ) : null}

      {["frequency", "price", "exams", "description", "capacity"].includes(currentStep) ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={advance}
            disabled={
              isSaving ||
              overCap ||
              (["exams", "description"].includes(currentStep) && examTypes.length === 0)
            }
          >
            {isSaving ? "Kaydediliyor…" : plan ? "Kaydet ve devam et" : currentStep === "description" ? "Taslağı kaydet ve devam et" : "Devam et"}
            {!isSaving ? <ArrowRight aria-hidden className="ml-2 h-4 w-4" /> : null}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StepCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-6 p-5 sm:p-7">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function PolicyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/25 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function FixedDuration({ minutes }: { minutes: number }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
      <Clock3 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Her görüşme {minutes} dakika</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Görüşme süresi bütün çalışma koçluğu planlarında sabittir.</p>
      </div>
      <Info aria-hidden className="ml-auto h-4 w-4 text-muted-foreground" />
    </div>
  );
}
