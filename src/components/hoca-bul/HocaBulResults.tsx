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
    // The resolution is a function of the stored draft and the preview cache,
    // neither of which the query key can see. Inheriting the app-wide five
    // minute staleTime therefore replayed whatever the previous visit resolved:
    // a student who edited their answers got their old matches back, and a
    // cached "redirect" from a cold visit threw them back to the goal question
    // moments after they finished the wizard. Re-resolving on every mount is
    // cheap — a valid session-cache hit still short-circuits before any request.
    staleTime: 0,
    refetchOnMount: "always",
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

  // Only this mount's own resolution may be acted on. A cached value from an
  // earlier visit is still handed over synchronously while the forced refetch
  // is in flight, and acting on it would either show the previous answers'
  // matches or replay a stale redirect and navigate the student out of the
  // route they just earned. Until the refetch settles this renders as loading.
  const resolved = resolution.isFetchedAfterMount ? resolution.data : undefined;

  useEffect(() => {
    if (resolved?.kind === "redirect") {
      router.replace(resolved.href);
    }
  }, [resolved, router]);

  if (resolved?.kind === "ready") {
    return <HocaBulResultsView preview={resolved.preview} answers={resolved.answers} />;
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
