"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  clearLessonQuestionState,
  fetchLessonQuestionState,
  getQuestionSessionErrorMessage,
  updateLessonQuestionState,
} from "@/lib/questionsApi";
import type { LessonQuestionState, LessonQuestionStateUpdate } from "@/types";
import {
  acceptLessonQuestionInvitation,
  dismissLessonQuestionInvitation,
  initialLessonQuestionInvitationState,
  readLessonQuestionInvitationDisposition,
  syncLessonQuestionInvitation,
  writeLessonQuestionInvitationDisposition,
} from "./lessonQuestionInvitation";

interface UseLessonQuestionSessionOptions {
  bookingId: string;
  enabled: boolean;
  isStudent: boolean;
}

export interface LessonQuestionSessionController {
  state: LessonQuestionState | undefined;
  stateIsLoading: boolean;
  stateIsError: boolean;
  updatePending: boolean;
  clearPending: boolean;
  panelOpen: boolean;
  invitationOpen: boolean;
  refetchState: () => void;
  updateState: (payload: LessonQuestionStateUpdate) => void;
  clearState: () => void;
  openPanel: () => void;
  closePanel: () => void;
  acceptInvitation: () => void;
  dismissInvitation: () => void;
}

export function useLessonQuestionSession({
  bookingId,
  enabled,
  isStudent,
}: UseLessonQuestionSessionOptions): LessonQuestionSessionController {
  const queryClient = useQueryClient();
  const [uiState, setUiState] = useState(initialLessonQuestionInvitationState);
  const queryKey = ["lesson-question-state", bookingId] as const;
  const stateQuery = useQuery({
    queryKey,
    queryFn: () => fetchLessonQuestionState(bookingId),
    enabled: enabled && Boolean(bookingId),
    refetchInterval: enabled ? 2_000 : false,
  });
  const questionState = stateQuery.data;

  useEffect(() => {
    setUiState(initialLessonQuestionInvitationState);
  }, [bookingId]);

  useEffect(() => {
    if (!enabled || !isStudent || stateQuery.isError) return;
    const state = questionState;
    const activeQuestionId = state?.active_question?.id ?? null;
    const version = state?.version ?? 0;
    const storedDisposition =
      typeof window !== "undefined" && activeQuestionId
        ? readLessonQuestionInvitationDisposition(
            window.sessionStorage,
            bookingId,
            version
          )
        : null;
    setUiState((current) =>
      syncLessonQuestionInvitation(current, {
        activeQuestionId,
        version,
        storedDisposition,
      })
    );
  }, [
    bookingId,
    enabled,
    isStudent,
    questionState,
    stateQuery.isError,
  ]);

  const update = useMutation({
    mutationFn: (payload: LessonQuestionStateUpdate) =>
      updateLessonQuestionState(bookingId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
    onError: (error) => {
      toast.error(
        getQuestionSessionErrorMessage(
          error,
          "Soru paylaşımı güncellenemedi. Bağlantını kontrol edip tekrar dene."
        )
      );
    },
  });
  const clear = useMutation({
    mutationFn: () => clearLessonQuestionState(bookingId),
    onSuccess: () => {
      queryClient.setQueryData<LessonQuestionState | undefined>(
        queryKey,
        (current) =>
          current
            ? {
                ...current,
                active_question: null,
                solution_revealed: false,
                correct_choice: "",
                solution_url: "",
                version: current.version + 1,
                updated_at: new Date().toISOString(),
              }
            : current
      );
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error(
        getQuestionSessionErrorMessage(
          error,
          "Paylaşım kapatılamadı. Bağlantını kontrol edip tekrar dene."
        )
      );
    },
  });

  const remember = useCallback(
    (disposition: "accepted" | "dismissed") => {
      const version = stateQuery.data?.version;
      if (
        typeof window !== "undefined" &&
        stateQuery.data?.active_question &&
        version !== undefined
      ) {
        writeLessonQuestionInvitationDisposition(
          window.sessionStorage,
          bookingId,
          version,
          disposition
        );
      }
    }, [bookingId, stateQuery.data]
  );

  const openPanel = useCallback(() => {
    const version = stateQuery.data?.version ?? 0;
    if (isStudent && stateQuery.data?.active_question) {
      remember("accepted");
      setUiState((current) =>
        acceptLessonQuestionInvitation(current, version)
      );
      return;
    }
    setUiState((current) => ({
      ...current,
      modalOpen: false,
      panelOpen: true,
    }));
  }, [isStudent, remember, stateQuery.data]);

  const closePanel = useCallback(() => {
    const version = stateQuery.data?.version ?? 0;
    if (isStudent && stateQuery.data?.active_question) {
      remember("dismissed");
      setUiState((current) =>
        dismissLessonQuestionInvitation(current, version)
      );
      return;
    }
    setUiState((current) => ({
      ...current,
      modalOpen: false,
      panelOpen: false,
    }));
  }, [isStudent, remember, stateQuery.data]);

  const acceptInvitation = useCallback(() => {
    const version = stateQuery.data?.version ?? 0;
    remember("accepted");
    setUiState((current) =>
      acceptLessonQuestionInvitation(current, version)
    );
  }, [remember, stateQuery.data?.version]);

  const dismissInvitation = useCallback(() => {
    const version = stateQuery.data?.version ?? 0;
    remember("dismissed");
    setUiState((current) =>
      dismissLessonQuestionInvitation(current, version)
    );
  }, [remember, stateQuery.data?.version]);

  return {
    state: stateQuery.data,
    stateIsLoading: stateQuery.isLoading,
    stateIsError: stateQuery.isError,
    updatePending: update.isPending,
    clearPending: clear.isPending,
    panelOpen: uiState.panelOpen,
    invitationOpen:
      isStudent &&
      Boolean(stateQuery.data?.active_question) &&
      uiState.modalOpen,
    refetchState: () => {
      void stateQuery.refetch();
    },
    updateState: (payload) => update.mutate(payload),
    clearState: () => clear.mutate(),
    openPanel,
    closePanel,
    acceptInvitation,
    dismissInvitation,
  };
}
