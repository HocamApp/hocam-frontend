"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { extractCoachingErrorMessage, type CoachingReportDraftInput } from "@/lib/coachingApi";
import { REPORT_AUTOSAVE_DELAY_MS, diffReportPayload } from "@/lib/coachingReportDraft";

export type ReportSaveStatus =
  | { kind: "idle" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

/**
 * Saves the report draft on its own, a moment after the typing stops.
 *
 * Three rules keep it from losing words:
 * - it sends only the fields that changed since the last save, so the room's
 *   short form and the full report page cannot wipe what the other wrote;
 * - the answer of a save never touches the text on screen: what was typed
 *   while the request was on its way stays, and is saved next;
 * - whatever is still unsaved is sent when the tab is hidden or the page is
 *   closed inside the app, and the browser warns before it is left for good.
 *
 * The first value seen once `enabled` turns true (the draft read from the
 * server) is the baseline, so nothing is saved until something changes.
 */
export function useReportAutosave({
  value,
  enabled,
  save,
  delayMs = REPORT_AUTOSAVE_DELAY_MS,
  describeError = extractCoachingErrorMessage,
}: {
  value: CoachingReportDraftInput;
  enabled: boolean;
  save: (changes: Partial<CoachingReportDraftInput>) => Promise<unknown>;
  delayMs?: number;
  describeError?: (error: unknown) => string;
}) {
  const [status, setStatus] = useState<ReportSaveStatus>({ kind: "idle" });
  const valueRef = useRef(value);
  valueRef.current = value;
  const saveRef = useRef(save);
  saveRef.current = save;
  const describeRef = useRef(describeError);
  describeRef.current = describeError;

  const savedRef = useRef<CoachingReportDraftInput | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const lastSavedAtRef = useRef<number | null>(null);
  const runRef = useRef<() => Promise<boolean>>(() => Promise.resolve(true));

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pending = useCallback((): Partial<CoachingReportDraftInput> => {
    return savedRef.current ? diffReportPayload(valueRef.current, savedRef.current) : {};
  }, []);

  const schedule = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void runRef.current();
    }, delayMs);
  }, [clearTimer, delayMs]);

  /** Saves what changed now. Resolves true when nothing is left unsaved, false when the save failed. */
  const run = useCallback((): Promise<boolean> => {
    clearTimer();
    if (inFlightRef.current) {
      return inFlightRef.current.then((ok) => (ok ? runRef.current() : false));
    }
    const baseline = savedRef.current;
    if (!baseline) return Promise.resolve(true);
    const changes = diffReportPayload(valueRef.current, baseline);
    if (Object.keys(changes).length === 0) return Promise.resolve(true);

    setStatus({ kind: "saving" });
    const request = saveRef.current(changes).then(
      () => {
        inFlightRef.current = null;
        savedRef.current = { ...(savedRef.current ?? baseline), ...changes } as CoachingReportDraftInput;
        if (Object.keys(pending()).length > 0) {
          setStatus({ kind: "dirty" });
          schedule();
        } else {
          lastSavedAtRef.current = Date.now();
          setStatus({ kind: "saved", at: lastSavedAtRef.current });
        }
        return true;
      },
      (error: unknown) => {
        inFlightRef.current = null;
        setStatus({ kind: "error", message: describeRef.current(error) });
        return false;
      },
    );
    inFlightRef.current = request;
    return request;
  }, [clearTimer, pending, schedule]);
  runRef.current = run;

  useEffect(() => {
    if (enabled && savedRef.current === null) savedRef.current = valueRef.current;
  }, [enabled]);

  const signature = JSON.stringify(value);
  useEffect(() => {
    if (!enabled || savedRef.current === null) return;
    if (Object.keys(pending()).length === 0) {
      // Typed back to what is saved: nothing to send any more.
      clearTimer();
      setStatus((current) =>
        current.kind === "dirty" || current.kind === "error"
          ? lastSavedAtRef.current
            ? { kind: "saved", at: lastSavedAtRef.current }
            : { kind: "idle" }
          : current,
      );
      return;
    }
    if (!inFlightRef.current) setStatus({ kind: "dirty" });
    schedule();
  }, [signature, enabled, pending, schedule, clearTimer]);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void runRef.current();
    };
    const onPageHide = () => {
      void runRef.current();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (inFlightRef.current === null && Object.keys(pending()).length === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled, pending]);

  // Leaving the page inside the app: send what is pending. The request outlives the component.
  useEffect(
    () => () => {
      clearTimer();
      if (Object.keys(pending()).length > 0) void runRef.current();
    },
    [clearTimer, pending],
  );

  return {
    status,
    flush: run,
    retry: useCallback(() => {
      void runRef.current();
    }, []),
  };
}
