"use client";

import { useEffect, useState } from "react";

import { serverNow } from "@/lib/serverClock";

/**
 * The server-corrected clock as a Date, refreshed on an interval so a label
 * that depends on it ("Katıl 18:20'de açılır", a countdown) changes while the
 * page stays open. A hint only: the server decides what a student may join.
 */
export function useServerNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date(serverNow()));

  useEffect(() => {
    const id = setInterval(() => setNow(new Date(serverNow())), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
