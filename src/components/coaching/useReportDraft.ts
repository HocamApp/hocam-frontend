"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  COACHING_FAZ6_QUERY_KEYS,
  fetchCoachingReportDraft,
  saveCoachingReportDraft,
  type CoachingRecommendedResource,
  type CoachingReportDraftInput,
} from "@/lib/coachingApi";
import {
  REPORT_EMPTY_DRAFT,
  REPORT_EMPTY_EXAM,
  buildReportPayload,
  createReportExamForm,
  type ReportExamForm,
} from "@/lib/coachingReportDraft";
import { useReportAutosave } from "./useReportAutosave";

/**
 * The report draft as the forms edit it, read once and then saved on its own.
 *
 * The server draft is read fresh every time the page opens (never from an
 * earlier cached copy, which could predate what the room's short form saved)
 * and put on screen once. Later answers never touch the text again: the only
 * writer of what is on screen is the tutor.
 */
export function useReportDraft(sessionId: string, autosaveDelayMs?: number) {
  const draftQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.reportDraft(sessionId),
    queryFn: () => fetchCoachingReportDraft(sessionId),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  const [draft, setDraft] = useState<CoachingReportDraftInput>(REPORT_EMPTY_DRAFT);
  const [exam, setExam] = useState<ReportExamForm>(REPORT_EMPTY_EXAM);
  const [resources, setResources] = useState<CoachingRecommendedResource[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const reportIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (hydrated || !draftQuery.isFetched || draftQuery.isFetching || draftQuery.isError) return;
    const server = draftQuery.data;
    if (server) {
      setDraft({ ...REPORT_EMPTY_DRAFT, ...server.content });
      setExam(createReportExamForm(server.content.exam_analysis));
      setResources(server.content.recommended_resources ?? []);
      reportIdRef.current = server.id;
    }
    setHydrated(true);
  }, [hydrated, draftQuery.isFetched, draftQuery.isFetching, draftQuery.isError, draftQuery.data]);

  const payload = useMemo(() => buildReportPayload({ draft, exam, resources }), [draft, exam, resources]);
  const autosave = useReportAutosave({
    value: payload,
    enabled: hydrated,
    delayMs: autosaveDelayMs,
    save: async (changes) => {
      const saved = await saveCoachingReportDraft(sessionId, changes);
      reportIdRef.current = saved.id;
    },
  });

  return {
    hydrated,
    error: draftQuery.isError,
    retry: () => draftQuery.refetch(),
    isRetrying: draftQuery.isFetching,
    draft,
    exam,
    resources,
    payload,
    autosave,
    setText: (field: keyof CoachingReportDraftInput, value: string) =>
      setDraft((current) => ({ ...current, [field]: value })),
    setExamField: (field: keyof ReportExamForm, value: string) =>
      setExam((current) => ({ ...current, [field]: value })),
    setResources,
    reportId: () => reportIdRef.current ?? draftQuery.data?.id ?? null,
  };
}
