"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Clock, Equals, X } from "@phosphor-icons/react";

import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { InlineError } from "@/components/shared/InlineError";
import { sectionBandClass } from "@/components/shared/SectionBand";
import { ShakeOnError } from "@/components/shared/ShakeOnError";
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
import { formatBpsPercent, formatTryMinor } from "@/lib/money";
import {
  buildCoachingPlanPayload,
  COACHING_SETUP_STEPS,
  type CoachingSetupStep,
} from "@/lib/coachingSetup";
import { cn } from "@/lib/utils";
import { CapacityPreviewCard } from "./CapacityPreviewCard";

const DESCRIPTION_MAX = 500;

// What the tutor is asked to answer; the box below is where the answers go.
const DESCRIPTION_QUESTIONS = [
  "Nasıl bir çalışma düzeni kuruyorsun?",
  "Görüşmelerde neyi takip ediyorsun?",
  "Öğrenci süreçte ne bekleyebilir?",
];

const EXAM_CONTEXT: Record<string, string> = {
  YKS: "TYT, AYT ve YDT hedeflerini birlikte kapsar.",
  DGS: "Ön lisans sonrası lisans geçişi için çalışma ritmi kurar.",
  KPSS: "Kamu sınavı hazırlığını plan ve takip odağında destekler.",
};

/**
 * Why a typed capacity cannot be saved, or null when it can. The range is the
 * one the helper line under the box names: at least the students already being
 * coached (never below one), at most what the tutor's hours can serve. The
 * server still has the last word; this only answers before the round trip.
 */
function capacityProblem(raw: string, min: number, max: number | null): string | null {
  const value = Number(raw);
  if (raw.trim() === "" || Number.isNaN(value)) return `En az ${min} yazabilirsin.`;
  if (!Number.isInteger(value)) return "Tam sayı yaz.";
  if (value < min) return `En az ${min} yazabilirsin.`;
  if (max !== null && value > max) {
    return `En fazla ${max} yazabilirsin, saatlerinle bu kadar öğrenciye bakabilirsin.`;
  }
  return null;
}

/**
 * What a field that cannot be saved as typed needs: it stays quiet until it has
 * been touched or the tutor tried to go on, then shows its reason, shakes once
 * each time it turns invalid or the reason changes, and takes the caret back
 * when "devam et" is refused.
 */
function useFieldFeedback<T extends HTMLElement = HTMLInputElement>(problem: string | null) {
  const [touched, setTouched] = useState(false);
  const [shakes, setShakes] = useState(0);
  const input = useRef<T>(null);

  useEffect(() => {
    if (touched && problem) setShakes((count) => count + 1);
  }, [touched, problem]);

  return {
    input,
    shakes,
    shown: touched ? problem : null,
    touch: () => setTouched(true),
    refuse: () => {
      setTouched(true);
      setShakes((count) => count + 1);
      input.current?.focus();
    },
  };
}

/** Why a typed price cannot be saved, or null. Zero is allowed: it means free. */
function priceProblem(raw: string, capMinor: number): string | null {
  const value = Number(raw);
  if (raw.trim() === "" || Number.isNaN(value)) return "Bir fiyat yaz. Ücretsiz sunmak için 0 yaz.";
  if (value < 0) return "Fiyat 0'dan küçük olamaz.";
  if (Math.round(value * 100) > capMinor) {
    return `En fazla ${formatTryMinor(capMinor)} yazabilirsin, bu fiyat üst sınırı aşıyor.`;
  }
  return null;
}

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

  const capacityMin = Math.max(1, capacity?.active_students ?? 0);
  const capacityMax =
    capacity && capacity.theoretical_capacity >= 1 ? capacity.theoretical_capacity : null;
  const capacityError = capacityProblem(maxStudents, capacityMin, capacityMax);
  const capacityField = useFieldFeedback(capacityError);

  const priceMinor = Math.round(Number(priceLira || 0) * 100);
  const priceError = priceProblem(priceLira, setupConfig.price_cap_minor);
  const priceField = useFieldFeedback(priceError);

  const examsError = examTypes.length === 0 ? "En az bir sınav seç." : null;
  const examsField = useFieldFeedback<HTMLButtonElement>(examsError);
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
    // Do not send a value we already know is wrong: say so, shake, and put the
    // caret back in the box. The server still has the last word.
    if (currentStep === "capacity" && capacityError) return capacityField.refuse();
    if (currentStep === "price" && priceError) return priceField.refuse();
    if (currentStep === "exams" && examsError) return examsField.refuse();
    const requiresSave = Boolean(plan) || currentStep === "description" || currentStep === "capacity";
    if (requiresSave) onSubmit(draft(), nextStep);
    else onContinue(nextStep);
  };

  const toggleExamType = (value: string) => {
    examsField.touch();
    setExamTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  return (
    <div className="space-y-6">
      {error ? <ErrorMessage message={error} /> : null}

      {currentStep === "frequency" ? (
        <StepCard
          title="Görüşme düzenin nasıl olsun?"
          description="Öğrencilerle ne sıklıkla görüşeceğini seç. Paket uzadıkça görüşme sayısı da artar."
        >
          <fieldset>
            <legend className="sr-only">Görüşme düzeni</legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3">
              {setupConfig.frequency_options.map((option) => (
                <FrequencyCard
                  key={option.value}
                  option={option}
                  selected={frequency === option.value}
                  onSelect={() => setFrequency(option.value)}
                />
              ))}
            </div>
          </fieldset>
          <FixedDuration minutes={setupConfig.session_duration_minutes} />
        </StepCard>
      ) : null}

      {currentStep === "price" ? (
        <StepCard
          title="Koçluk görüşme fiyatın"
          description="Koçluk ders paketine eklenen bir hizmettir. Bir koçluk görüşmesi, 40 dakikalık ders fiyatının belirli bir oranından pahalı olamaz."
        >
          {/* The ceiling, worked out left to right. Plain class strings:
              tailwind-merge would drop a named size next to a text colour. */}
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <div className="min-w-[9rem] flex-1 rounded-input border border-line px-4 py-3">
              <p className="text-label text-ink-mid">40 dakikalık ders fiyatın</p>
              <p className="mt-1 text-h3-m font-bold tabular-nums text-ink md:text-h3 md:font-bold">
                {formatTryMinor(setupConfig.lesson_price_minor)}
              </p>
            </div>
            <span className="flex items-center justify-center text-ink-mid">
              <X aria-hidden="true" className="h-5 w-5" />
              <span className="sr-only">çarpı</span>
            </span>
            <div className="min-w-[7rem] flex-[0.7] rounded-input border border-line px-4 py-3">
              <p className="text-label text-ink-mid">Koçluk oranı</p>
              <p className="mt-1 text-h3-m font-bold tabular-nums text-ink md:text-h3 md:font-bold">
                %{setupConfig.max_price_ratio_percent}
              </p>
            </div>
            <span className="flex items-center justify-center text-ink-mid">
              <Equals aria-hidden="true" className="h-5 w-5" />
              <span className="sr-only">eşittir</span>
            </span>
            <div className="min-w-[9rem] flex-1 rounded-input bg-gold px-4 py-3 text-gold-ink">
              <p className="text-label">Koçluk görüşmen en fazla</p>
              <p className="mt-1 text-h3-m font-bold tabular-nums md:text-h3 md:font-bold">
                {formatTryMinor(setupConfig.price_cap_minor)}
              </p>
            </div>
          </div>

          <ShakeOnError trigger={priceField.shakes} className="max-w-sm">
            <Label htmlFor="coaching-price">Koçluk görüşme fiyatın (₺)</Label>
            <Input
              ref={priceField.input}
              id="coaching-price"
              type="number"
              min={0}
              max={setupConfig.price_cap_minor / 100}
              step="0.01"
              value={priceLira}
              onChange={(event) => {
                setPriceLira(event.target.value);
                priceField.touch();
              }}
              aria-invalid={priceField.shown ? true : undefined}
              aria-describedby={priceField.shown ? "coaching-price-error coaching-price-hint" : "coaching-price-hint"}
              className={priceField.shown ? "mt-1 border-error focus-visible:border-error" : "mt-1"}
            />
            <InlineError id="coaching-price-error" message={priceField.shown} size="sm" className="mt-2" />
            <p id="coaching-price-hint" className="mt-2 text-label leading-5 text-ink-mid">
              Ücretsiz sunmak için 0 yaz. Her görüşmeden %{formatBpsPercent(setupConfig.commission_bps)} komisyon düşülür; paket indirimi ve net kazancın bu fiyata göre hesaplanır.
            </p>
          </ShakeOnError>
        </StepCard>
      ) : null}

      {currentStep === "exams" ? (
        <StepCard
          title="Koçluk verdiğin sınavlar"
          description="Birden fazla seçebilirsin. Öğrenciler teklifini hedef sınav grubuna göre görür. TYT, AYT ve YDT ayrı seçenek değildir, YKS grubunun içindedir."
        >
          <fieldset aria-describedby={examsField.shown ? "coaching-exams-error" : undefined}>
            <legend className="sr-only">Hedef sınav grupları</legend>
            <ShakeOnError trigger={examsField.shakes}>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3">
                {setupConfig.exam_groups.filter(isCoachingExamGroup).map((exam, index) => {
                  const selected = examTypes.includes(exam);
                  return (
                    <ExamCard
                      key={exam}
                      ref={index === 0 ? examsField.input : undefined}
                      exam={exam}
                      description={EXAM_CONTEXT[exam]}
                      selected={selected}
                      onToggle={() => toggleExamType(exam)}
                    />
                  );
                })}
              </div>
            </ShakeOnError>
            <InlineError id="coaching-exams-error" message={examsField.shown} size="sm" className="mt-3" />
          </fieldset>
        </StepCard>
      ) : null}

      {currentStep === "description" ? (
        <StepCard
          title="Öğrenciye kısa bir açıklama yaz"
          description="Aşağıdaki üç soruyu yanıtlayan birkaç cümle yeter. Bu alan isteğe bağlıdır."
        >
          <ol className="space-y-2">
            {DESCRIPTION_QUESTIONS.map((question, index) => (
              <li
                key={question}
                className="flex items-center gap-3 rounded-input border border-line px-4 py-2.5 text-body text-ink"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-ink text-label font-bold tabular-nums text-paper"
                >
                  {index + 1}
                </span>
                {question}
              </li>
            ))}
          </ol>
          <div>
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
            <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-label text-ink-mid">
              <span className="tabular-nums">{description.length} / {DESCRIPTION_MAX}</span>
              <span>Platform dışı iletişim, sınırsız destek veya sınav sonucu garantisi yazma.</span>
            </div>
          </div>
        </StepCard>
      ) : null}

      {currentStep === "capacity" ? (
        <StepCard
          title="Kaç öğrenciyle çalışmak istiyorsun?"
          description="Koçluk saatlerin 30 dakikalık görüşmelere bölünür. Seçtiğin görüşme sıklığına göre bu saatlerle en fazla kaç öğrenciye bakabileceğin hesaplanır. Aşağıda kendi sınırını seçersin."
        >
          {capacity ? <CapacityPreviewCard capacity={capacity} /> : null}
          <ShakeOnError trigger={capacityField.shakes} className="max-w-sm">
            <Label htmlFor="coaching-capacity">Aynı anda en fazla kaç öğrenciye koçluk vereceksin?</Label>
            <Input
              ref={capacityField.input}
              id="coaching-capacity"
              type="number"
              min={capacityMin}
              max={capacityMax ?? undefined}
              value={maxStudents}
              onChange={(event) => {
                setMaxStudents(event.target.value);
                capacityField.touch();
              }}
              aria-invalid={capacityField.shown ? true : undefined}
              aria-describedby={capacityField.shown ? "coaching-capacity-error coaching-capacity-hint" : "coaching-capacity-hint"}
              className={capacityField.shown ? "mt-1 border-error focus-visible:border-error" : "mt-1"}
            />
            <InlineError id="coaching-capacity-error" message={capacityField.shown} size="sm" className="mt-2" />
            <p id="coaching-capacity-hint" className="mt-2 text-label leading-5 text-ink-mid">
              {capacity && capacity.theoretical_capacity >= 1
                ? `En az ${capacityMin}, en fazla ${capacity.theoretical_capacity} yazabilirsin. Uygun olmayan bir sayı yazarsan önceki sayın kalır ve nedeni burada yazar.`
                : "Önce koçluk saati eklemelisin, sonra buradan sınırını seçebilirsin."}
            </p>
          </ShakeOnError>
        </StepCard>
      ) : null}

      {["frequency", "price", "exams", "description", "capacity"].includes(currentStep) ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={advance}
            disabled={
              isSaving ||
              (currentStep === "description" && examTypes.length === 0)
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
    <Card className="rounded-card border-line bg-surface shadow-none">
      <CardContent className="space-y-6 p-5 sm:p-8">
        <div className="max-w-2xl">
          <h2 className="text-[1.75rem] font-bold leading-[1.15] tracking-[-0.015em] text-ink text-balance">{title}</h2>
          <p className="mt-3 text-body leading-[1.6] text-ink-mid text-pretty">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * One exam to choose, and any number may be. The chosen ones wear a gold header
 * with --gold-ink on it and an ink "Seçildi" pill, so a choice among several
 * (gold) reads apart from the one-of-three routine (pink) on the step before.
 * Gold is a surface here, never text.
 */
const ExamCard = forwardRef<
  HTMLButtonElement,
  { exam: string; description: string | undefined; selected: boolean; onToggle: () => void }
>(function ExamCard({ exam, description, selected, onToggle }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={exam}
      aria-pressed={selected}
      onClick={onToggle}
      className={`overflow-hidden rounded-card border bg-surface text-left transition-colors duration-[var(--duration-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
        selected ? "border-gold" : "border-line hover:border-ink"
      }`}
    >
      <span
        className={`flex items-center justify-between gap-3 px-4 py-3 ${
          selected ? "bg-gold text-gold-ink" : "border-b border-line"
        }`}
      >
        <span className="text-body font-bold">{exam}</span>
        {selected ? (
          <span className="inline-flex items-center gap-1 rounded-pill bg-ink px-3 py-0.5 text-label text-paper">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            Seçildi
          </span>
        ) : (
          <span aria-hidden="true" className="h-5 w-5 rounded-pill border border-line" />
        )}
      </span>
      <span className="block px-4 pb-4 pt-3 text-small leading-6 text-ink-mid">{description}</span>
    </button>
  );
});

/** The package whose session count is the card's headline number. */
const HEADLINE_WEEKS = 4;

/**
 * One routine to choose from. The headline is what a four-week package gives,
 * large, and the other packages follow as rows; every figure comes from the
 * server's setup config. The chosen card wears the pink band with a flat gold
 * "Seçili" pill (gold on pink is the one pairing allowed at badge scale), so
 * which one is chosen is clear before reading a word.
 *
 * Plain class strings: tailwind-merge would drop a named size such as
 * `text-h2-m` next to a text colour.
 */
function FrequencyCard({
  option,
  selected,
  onSelect,
}: {
  option: CoachingSetupConfig["frequency_options"][number];
  selected: boolean;
  onSelect: () => void;
}) {
  const headline =
    option.packages.find((item) => item.weeks === HEADLINE_WEEKS) ?? option.packages[0];
  const others = option.packages.filter((item) => item !== headline);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`overflow-hidden rounded-card border bg-surface text-left transition-colors duration-[var(--duration-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
        selected ? "border-pink" : "border-line hover:border-ink"
      }`}
    >
      <span
        className={
          selected
            ? sectionBandClass("pink", "px-4 py-3")
            : "flex items-center justify-between gap-3 border-b border-line px-4 py-3"
        }
      >
        <span className="text-body font-bold">{option.label}</span>
        {selected ? (
          <span className="inline-flex items-center gap-1 rounded-pill bg-gold px-3 py-0.5 text-label text-gold-ink">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            Seçili
          </span>
        ) : (
          <span aria-hidden="true" className="h-5 w-5 rounded-pill border border-line" />
        )}
      </span>
      <span className="block px-4 pb-4 pt-3">
        {headline ? (
          <>
            <span className="block text-h2-m font-bold tabular-nums text-ink md:text-h2">
              {headline.total_sessions}
            </span>
            <span className="mt-1 block text-small text-ink-mid">
              görüşme, {headline.weeks} haftalık pakette
            </span>
          </>
        ) : null}
        <span className="mt-3 block">
          {others.map((item) => (
            <span
              key={item.duration_days}
              className="flex justify-between gap-3 border-t border-line py-1.5 text-small tabular-nums"
            >
              <span className="text-ink-mid">{item.weeks} haftada</span>
              <span className="font-bold text-ink">{item.total_sessions}</span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

function FixedDuration({ minutes }: { minutes: number }) {
  return (
    <p className="flex items-center gap-3 text-small text-ink-mid">
      <Clock aria-hidden className="h-5 w-5 shrink-0 text-ink" />
      <span>
        <strong className="font-medium text-ink">Her görüşme {minutes} dakika.</strong>{" "}
        Bu süre bütün koçluk planlarında aynıdır.
      </span>
    </p>
  );
}
