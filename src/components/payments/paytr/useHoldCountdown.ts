"use client";

import { useEffect, useState } from "react";

import { serverNow } from "@/lib/serverClock";

/**
 * Time left on the hold of an unpaid purchase, counted down once a second.
 *
 * The deadline is the server's (`payment_deadline`); the clock it is measured
 * against is the app's server-corrected one (`serverNow`), never the browser's
 * own, so a student whose laptop clock is wrong still sees the right number.
 * Nothing here decides anything: the server refuses a payment after the hold,
 * and this only says how long is left.
 *
 * `null` when there is no deadline (a purchase that holds no hours).
 */
export function useHoldCountdown(
  deadlineMs: number | null,
  now: () => number = serverNow
): number | null {
  const [left, setLeft] = useState<number | null>(() =>
    deadlineMs === null ? null : deadlineMs - now()
  );

  useEffect(() => {
    if (deadlineMs === null) {
      setLeft(null);
      return;
    }
    const tick = () => setLeft(deadlineMs - now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // `now` is a stable function for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineMs]);

  return left;
}

/** "07:42", or "1:07:42" for an hour or more. Never negative. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export type HoldPhase = "normal" | "soon" | "last" | "expired";

/** How urgent the number is: the screen reader hears a change of phase, not
 * every second. */
export function holdPhase(ms: number): HoldPhase {
  if (ms <= 0) return "expired";
  if (ms <= 60_000) return "last";
  if (ms <= 5 * 60_000) return "soon";
  return "normal";
}
