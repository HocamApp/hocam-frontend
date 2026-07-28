"use client";

import { useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { readDraft, touchDraft, writeDraft } from "@/lib/hocaBulDraft";
import {
  getFirstUnansweredStepId,
  getValidatedMatchingAnswers,
  isFlowComplete,
  pruneAnswersAgainstOptions,
  toMatchingAnswers,
} from "@/lib/hocaBulFlow";
import { getOrFetchPreview, readPreview } from "@/lib/hocaBulPreviewCache";
import { buildResultEditHref, createDraftFromPreference } from "@/lib/hocaBulResults";
import {
  fetchMatchingOptions,
  fetchMatchingPreferences,
  previewTutorMatches,
  saveMatchingPreferences,
} from "@/lib/matchingApi";
import { getLocalStorage, getSessionStorage } from "@/lib/safeStorage";
import type { MatchingAnswers, MatchingPreview } from "@/types";

import { HocaBulResultsView } from "./HocaBulResultsView";
import { HocaBulSubmissionStatus } from "./HocaBulSubmissionStatus";

const PREVIEW_TIMEOUT_MS = 15_000;

type Resolution =
  | { kind: "redirect"; href: string }
  | { kind: "ready"; answers: MatchingAnswers; preview: MatchingPreview };

function isRateLimited(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 429;
}

export function HocaBulResults() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const bypassCacheRef = useRef(false);

  const resolution = useQuery<Resolution>({
    queryKey: ["hoca-bul-results", userId],
    enabled: Boolean(userId),
    retry: false,
    queryFn: async ({ signal }) => {
      if (!userId) return { kind: "redirect", href: "/hoca-bul?adim=hedef" };

      const localStorage = getLocalStorage();
      const sessionStorage = getSessionStorage();
      let draft = readDraft(localStorage, userId);

      if (!draft) {
        const preference = await fetchMatchingPreferences();
        if (!preference) {
          return { kind: "redirect", href: "/hoca-bul?adim=hedef" };
        }
        draft = createDraftFromPreference(userId, preference);
        writeDraft(localStorage, draft);
      } else if (!isFlowComplete(draft.answers.goal, draft.answers, draft.client)) {
        const gap = getFirstUnansweredStepId(draft.answers.goal, draft.answers, draft.client);
        return { kind: "redirect", href: buildResultEditHref(gap) };
      }

      const answers = toMatchingAnswers(draft.answers);
      if (!answers) {
        const gap = getFirstUnansweredStepId(draft.answers.goal, draft.answers, draft.client);
        return { kind: "redirect", href: buildResultEditHref(gap) };
      }

      if (!bypassCacheRef.current) {
        const cached = readPreview(sessionStorage, userId, answers);
        if (cached) return { kind: "ready", answers, preview: cached };
      }

      const options = await fetchMatchingOptions(answers.goal, answers.subject_keys);
      const validated = getValidatedMatchingAnswers(draft.answers, draft.client, options);
      if (!validated) {
        const pruned = pruneAnswersAgainstOptions(draft.answers, draft.client, options);
        const gap = getFirstUnansweredStepId(pruned.answers.goal, pruned.answers, pruned.client);
        writeDraft(localStorage, touchDraft(draft, {
          answers: pruned.answers,
          client: pruned.client,
          stepId: gap,
        }));
        return { kind: "redirect", href: buildResultEditHref(gap) };
      }

      const bypassCache = bypassCacheRef.current;
      bypassCacheRef.current = false;
      const result = await getOrFetchPreview({
        storage: sessionStorage,
        userId,
        answers: validated,
        bypassCache,
        fetcher: (payload) => previewTutorMatches(payload, { signal, timeoutMs: PREVIEW_TIMEOUT_MS }),
      });

      try {
        await saveMatchingPreferences(validated);
      } catch {
        // A valid cached preview plus the complete local draft remain enough.
      }

      return { kind: "ready", answers: validated, preview: result.preview };
    },
  });

  useEffect(() => {
    if (resolution.data?.kind === "redirect") {
      router.replace(resolution.data.href);
    }
  }, [resolution.data, router]);

  if (resolution.data?.kind === "ready") {
    return <HocaBulResultsView preview={resolution.data.preview} answers={resolution.data.answers} />;
  }

  if (resolution.isError) {
    return (
      <HocaBulSubmissionStatus
        state="error"
        rateLimited={isRateLimited(resolution.error)}
        onRetry={() => {
          bypassCacheRef.current = true;
          void resolution.refetch();
        }}
        onBack={() => router.push(buildResultEditHref("kontrol"))}
      />
    );
  }

  return <HocaBulSubmissionStatus state="loading" />;
}
