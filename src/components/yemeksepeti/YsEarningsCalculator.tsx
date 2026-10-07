"use client";

import { useId, useState } from "react";

import { monthlyEarnings, WEEKS_PER_MONTH } from "@/lib/earnings";
import { formatPrice } from "@/lib/utils";

import { tutors as copy } from "./ysHomeCopy";
import { LESSON_MINUTES } from "./ysHomeFacts";

const DEFAULT_LESSONS_PER_WEEK = 6;

/**
 * "Ne kadar kazanırsın?" in the tutors band.
 *
 * Only rendered while NEXT_PUBLIC_TUTOR_EARNINGS_PREVIEW is "true" and the
 * commission and price range are decided (see YsTutorBand). The commission is
 * read-only: it is the platform's rate, not something the visitor sets. In
 * flow on the band, so no shadow.
 */
export function YsEarningsCalculator({
  commissionPercent,
  defaultPrice,
}: {
  commissionPercent: number;
  defaultPrice: number;
}) {
  const id = useId();
  const [lessonsPerWeek, setLessonsPerWeek] = useState(DEFAULT_LESSONS_PER_WEEK);
  const [price, setPrice] = useState(defaultPrice);
  const result = monthlyEarnings(lessonsPerWeek, Math.max(price, 0), commissionPercent);
  const weeks = new Intl.NumberFormat("tr-TR").format(WEEKS_PER_MONTH);

  return (
    <form
      aria-labelledby={`${id}-title`}
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-5 rounded-card bg-surface p-7 text-ink lg:sticky lg:top-[calc(var(--app-header-h)+24px)]"
    >
      <div>
        <h3 id={`${id}-title`} className="text-[22px] font-bold leading-7">
          {copy.calculator.title}
        </h3>
        <p className="mt-1 text-small text-ink-mid">{copy.calculator.sub}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3 text-small font-medium">
          <label htmlFor={`${id}-weekly`}>{copy.calculator.lessonsPerWeek}</label>
          <b className="text-[18px] tabular-nums">{lessonsPerWeek}</b>
        </div>
        <input
          id={`${id}-weekly`}
          type="range"
          min={1}
          max={20}
          value={lessonsPerWeek}
          onChange={(event) => setLessonsPerWeek(Number(event.target.value))}
          className="h-6 w-full accent-pink"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-2.5">
          <label htmlFor={`${id}-price`} className="text-small font-medium">
            {copy.calculator.price}
          </label>
          <div className="flex h-11 items-center gap-2 rounded-input border border-line px-3.5 focus-within:border-ink">
            <input
              id={`${id}-price`}
              type="number"
              inputMode="numeric"
              min={0}
              step={10}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value) || 0)}
              className="min-w-0 flex-1 border-0 bg-transparent text-base font-semibold tabular-nums text-ink outline-none"
            />
            <span className="text-ink-mid">₺</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2.5">
          <span className="text-small font-medium">{copy.calculator.commission}</span>
          <div className="flex h-11 items-center rounded-input border border-line px-3.5 text-base font-semibold tabular-nums">
            %{commissionPercent}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[14px] bg-paper p-[18px]">
        <Row label={copy.calculator.lessonsPerMonth} value={String(result.lessons)} />
        <Row label={copy.calculator.gross} value={formatPrice(result.gross)} />
        <Row label={copy.calculator.commissionAmount} value={`−${formatPrice(result.commission)}`} />
        <div className="flex items-baseline justify-between border-t border-line pt-2.5">
          <span className="text-small font-semibold">{copy.calculator.net}</span>
          <b className="text-[30px] font-bold leading-[34px] tracking-[-0.5px] tabular-nums">
            {formatPrice(result.net)}
          </b>
        </div>
      </div>

      <small className="text-xs leading-[18px] text-ink-mid">
        {copy.calculator.note(LESSON_MINUTES, weeks)}
      </small>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-small tabular-nums text-ink-mid">
      <span>{label}</span>
      <b className="font-semibold text-ink">{value}</b>
    </div>
  );
}
