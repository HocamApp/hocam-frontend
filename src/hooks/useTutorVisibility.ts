"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyTutorProfile,
  pauseTutorProfile,
  resumeTutorProfile,
} from "@/lib/tutorsApi";
import type { TutorProfile } from "@/types";

/**
 * The tutor's marketplace visibility, as one piece of state with one writer.
 *
 * Two surfaces show this control — the header on desktop and the profile menu
 * on a phone — and they must not disagree, so the query key, the optimistic
 * write and the error handling live here rather than in either of them.
 *
 * `is_public` is not only the tutor's to set: `apps/lessons/services.py`
 * hides a profile automatically at the third no-show. That is why the state
 * is read back from `["tutor-me"]` rather than held locally: the toggle
 * reports the value, it does not own it.
 */
export function useTutorVisibility() {
  const { isAuthenticated, isTutor } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated && isTutor,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? resumeTutorProfile() : pauseTutorProfile(),
    onMutate: (next: boolean) => {
      setError(null);
      const previous = queryClient.getQueryData<TutorProfile>(["tutor-me"]);
      if (previous) {
        queryClient.setQueryData<TutorProfile>(["tutor-me"], {
          ...previous,
          is_public: next,
        });
      }
      return { previous };
    },
    onError: (err, _next, context) => {
      // Put the old value back before saying anything: a switch that stays
      // flipped after a failed write is worse than the failure.
      if (context?.previous) {
        queryClient.setQueryData(["tutor-me"], context.previous);
      }
      setError(visibilityErrorMessage(err));
    },
    onSuccess: () => {
      // The endpoints answer with a message, not a profile, so the value has
      // to come back from the server rather than from the response.
      queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      // The public directory and the tutor's own page both filter on this.
      queryClient.invalidateQueries({ queryKey: ["tutors"] });
    },
  });

  const isPublic = profile?.is_public ?? null;

  return {
    profile: profile ?? null,
    /** `null` until the profile has loaded — never guess a default here. */
    isPublic,
    isVerified: Boolean(profile?.is_verified),
    /** The student-facing page only exists for a verified, published tutor. */
    previewHref:
      profile && profile.is_public && profile.is_verified
        ? `/tutors/${profile.id}`
        : null,
    isPending: mutation.isPending,
    error,
    setVisible: (next: boolean) => mutation.mutate(next),
    clearError: () => setError(null),
  };
}

/**
 * 409 is not a failure to report as one: it means an account-deletion request
 * is open, and the server's own sentence explains the way out better than a
 * generic message would.
 */
function visibilityErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)
      ?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }
  return "Görünürlük ayarın kaydedilemedi. Tekrar dene.";
}
