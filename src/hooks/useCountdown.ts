"use client";

import { useEffect, useState } from "react";

/**
 * Turkish countdown label ("X saat Y dakika") to a target Date, re-rendering
 * every minute. Returns null once the target has passed.
 */
export function useCountdownLabel(target: Date | null): string | null {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.ceil(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 1) return `${hours} saat ${minutes} dakika`;
  return `${minutes} dakika`;
}
