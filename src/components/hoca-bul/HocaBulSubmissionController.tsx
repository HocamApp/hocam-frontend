"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { trackHocaBul } from "@/lib/hocaBulAnalytics";
import { getOrFetchPreview } from "@/lib/hocaBulPreviewCache";
import {
  previewTutorMatches,
  saveMatchingPreferences,
} from "@/lib/matchingApi";
import { getSessionStorage } from "@/lib/safeStorage";
import type { MatchingAnswers } from "@/types";

import { HocaBulSubmissionStatus } from "./HocaBulSubmissionStatus";
import { HocaBulWizard } from "./HocaBulWizard";

const PREVIEW_TIMEOUT_MS = 15_000;

function isRateLimited(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 429;
}

function isCancelled(error: unknown): boolean {
  return axios.isCancel(error) ||
    (axios.isAxiosError(error) && error.code === "ERR_CANCELED");
}

export function HocaBulSubmissionController() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const lastAnswersRef = useRef<MatchingAnswers | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const submission = useMutation({
    mutationFn: async ({
      answers,
      bypassCache,
    }: {
      answers: MatchingAnswers;
      bypassCache: boolean;
    }) => {
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      const result = await getOrFetchPreview({
        storage: getSessionStorage(),
        userId,
        answers,
        bypassCache,
        fetcher: (payload) =>
          previewTutorMatches(payload, {
            signal: controller.signal,
            timeoutMs: PREVIEW_TIMEOUT_MS,
          }),
      });

      trackHocaBul({
        event: "hoca_bul_submitted",
        goal: answers.goal,
        subject_count: answers.subject_keys.length,
        served_from_cache: result.servedFromCache,
      });

      try {
        await saveMatchingPreferences(answers);
      } catch {
        // The preview and draft are enough to show results. Preference
        // persistence is a best-effort fallback for a later direct visit.
      }

      return result.preview;
    },
    onSuccess: () => {
      router.push("/hoca-bul/sonuclar");
    },
    onError: (error) => {
      if (isCancelled(error)) return;
      inFlightRef.current = false;
      setRateLimited(isRateLimited(error));
      setStatus("error");
    },
  });

  const submit = useCallback(
    (answers: MatchingAnswers, bypassCache: boolean) => {
      if (!userId || inFlightRef.current) return;
      inFlightRef.current = true;
      lastAnswersRef.current = answers;
      setRateLimited(false);
      setStatus("loading");
      submission.mutate({ answers, bypassCache });
    },
    [submission, userId]
  );

  const handleComplete = useCallback(
    (answers: MatchingAnswers) => submit(answers, false),
    [submit]
  );

  const handleRetry = useCallback(() => {
    const answers = lastAnswersRef.current;
    if (!answers) return;
    inFlightRef.current = false;
    submit(answers, true);
  }, [submit]);

  const handleBack = useCallback(() => {
    inFlightRef.current = false;
    setStatus("idle");
  }, []);

  return (
    <>
      <HocaBulWizard
        onComplete={handleComplete}
        completionPending={status === "loading"}
      />
      {status === "loading" ? (
        <HocaBulSubmissionStatus state="loading" />
      ) : status === "error" ? (
        <HocaBulSubmissionStatus
          state="error"
          rateLimited={rateLimited}
          onRetry={handleRetry}
          onBack={handleBack}
        />
      ) : null}
    </>
  );
}
