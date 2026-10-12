import Link from "next/link";

import { formatCountdown, holdPhase } from "./useHoldCountdown";

const SPOKEN: Record<"soon" | "last", string> = {
  soon: "Ödeme süresinin bitmesine 5 dakikadan az kaldı.",
  last: "Ödeme süresinin bitmesine 1 dakikadan az kaldı.",
};

/**
 * What is left of the time the student's hours are held for, above the payment
 * form.
 *
 * It says what is being kept for them, what to do with the number, and what
 * happens at zero. The number is a countdown to the server's deadline, so it is
 * never longer than the truth. The screen reader is not read a number every
 * second: the timer is silent, and a polite status line changes only when the
 * time crosses five minutes and one minute.
 *
 * When it reaches zero the hours are back on sale and a payment cannot be
 * started for them: the notice becomes the way back to choosing hours again.
 */
export function PayTRHoldNotice({
  msLeft,
  restartHref,
  className,
}: {
  /** Milliseconds until the hold ends; null when the purchase holds nothing. */
  msLeft: number | null;
  /** Where to choose the hours again. */
  restartHref: string;
  className?: string;
}) {
  if (msLeft === null) return null;
  const phase = holdPhase(msLeft);

  if (phase === "expired") {
    return (
      <section
        aria-labelledby="hold-expired-title"
        className={`rounded-[20px] border border-[#02171a] bg-white p-4 sm:p-6 ${className ?? ""}`}
      >
        <h2 id="hold-expired-title" className="text-base font-semibold">
          Saatlerin süresi doldu
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#02171a]">
          Bu satın alma için ayrılan saatler yeniden herkese açıldı. Baştan başlayıp ders saatlerini
          yeniden seçebilirsin.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href={restartHref}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[var(--pink)] px-6 text-base font-medium text-white hover:bg-[var(--pink-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2"
          >
            Yeniden başla
          </Link>
          <Link
            href="/profile/payments"
            className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-[#02171a] px-6 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2"
          >
            Paketlerim
          </Link>
        </div>
      </section>
    );
  }

  const urgent = phase !== "normal";
  return (
    <section
      aria-label="Saat ayırma süresi"
      className={`rounded-[20px] border bg-white p-4 sm:p-6 ${
        urgent ? "border-[#02171a]" : "border-[#e6dddd]"
      } ${className ?? ""}`}
    >
      <p className="text-sm font-medium text-[#02171a]">Saatlerin senin için ayrıldı</p>
      <p className="mt-1 text-sm leading-6 text-[#5c6b6d]">
        Ödemeyi{" "}
        <span
          role="timer"
          aria-live="off"
          className={`tabular-nums ${urgent ? "font-bold text-[#02171a]" : "font-semibold text-[#02171a]"}`}
        >
          {formatCountdown(msLeft)}
        </span>{" "}
        içinde tamamla. Süre dolunca saatler yeniden herkese açılır.
      </p>
      <p role="status" className="sr-only">
        {phase === "soon" || phase === "last" ? SPOKEN[phase] : ""}
      </p>
    </section>
  );
}
