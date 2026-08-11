"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  coachingFrequencyLabel,
  type CoachingEligibility,
} from "@/lib/coachingApi";

const INCLUDED = [
  "Çalışma programı",
  "Deneme değerlendirmesi",
  "İlerleme raporu",
  "Kaynak önerileri",
  "Mesajlara 24 saat içinde yanıt",
];

/**
 * The coaching add-on choice.
 *
 * Never pre-selected — not even when it is free (master spec §13.4): the
 * student picks it deliberately. Uses the same selection-card language as
 * CheckoutProductPicker (aria-pressed button, primary ring when chosen)
 * rather than introducing a second visual system.
 */
export function CoachingChoiceCard({
  eligibility,
  selected,
  onSelect,
}: {
  eligibility: CoachingEligibility;
  selected: boolean;
  onSelect: () => void;
}) {
  const plan = eligibility.plan;
  if (!plan) return null;

  const disabled = !eligibility.eligible;

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected && "border-primary bg-primary/5 ring-1 ring-primary",
        !selected && !disabled && "hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {plan.is_free ? "Ücretsiz Çalışma Koçluğu" : "Çalışma Koçluğu"}
          </p>
          <p className="text-sm text-muted-foreground">
            {coachingFrequencyLabel(plan.frequency)} ·{" "}
            {plan.session_duration_minutes} dk
          </p>
        </div>
        {disabled ? (
          <Badge variant="secondary">Şu anda seçilemez</Badge>
        ) : (
          <p className="text-sm font-semibold">
            {plan.is_free ? "₺0" : plan.price_per_session_display}
            <span className="font-normal text-muted-foreground"> / görüşme</span>
          </p>
        )}
      </div>

      {disabled ? (
        <p className="mt-3 text-sm text-muted-foreground">{eligibility.message}</p>
      ) : (
        <>
          {selected ? (
            <div className="mt-4 space-y-3 border-t pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Dahil olanlar
              </p>
              <ul className="space-y-1 text-sm">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden="true" className="text-primary">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {plan.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Toplam koçluk görüşmesi ve tutarı, bir sonraki adımda seçtiğin
                paket süresine göre hesaplanacaktır.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Çalışma programı, deneme değerlendirmesi, ilerleme raporu ve 24
              saat içinde mesaj yanıtı.
            </p>
          )}
        </>
      )}
    </button>
  );
}
