"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { fetchProfileMe, updateProfileMe } from "@/lib/profileApi";
import { getLocalStorage } from "@/lib/safeStorage";
import {
  mergeHints,
  mergeRecords,
  parseUiHints,
  readLocalHints,
  writeLocalHints,
  type UiHintKey,
  type UiHintRecord,
  type UiHints,
} from "@/lib/tutorSetupHints";

/**
 * Fired on `window` after every `record`, so the several components of one
 * page that each call `useUiHints` (the tour and the chat hint on Panom) see
 * each other's answers at once instead of waiting for the account round trip.
 */
const CHANGED_EVENT = "hocam:ui-hints-changed";
type ChangedDetail = { userId: string; key: UiHintKey; record: UiHintRecord };

/**
 * Per-user "has seen / dismissed" state for in-product hints.
 *
 * The account is the source of truth (`preferences.ui_hints` on /profile/me/),
 * so a tutor who dismissed a hint on a laptop does not meet it again on a
 * phone. A per-user localStorage mirror covers the gap before the backend
 * field exists, a failed write, and a slow first load: the two sides are
 * merged field by field, never replaced.
 *
 * `ready` is false until both sides have been read, and for an admin
 * impersonating a tutor. Callers show nothing until it is true, so a hint can
 * never flash for someone who already dismissed it, and an admin looking over
 * a tutor's shoulder never writes into that tutor's state.
 */
export function useUiHints() {
  const { user, isAuthenticated, isImpersonating } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const profile = useQuery({
    queryKey: ["profile-me"],
    queryFn: fetchProfileMe,
    enabled: isAuthenticated && Boolean(userId) && !isImpersonating,
    staleTime: 60_000,
    retry: false,
  });

  const [local, setLocal] = useState<UiHints | null>(null);
  const localRef = useRef<UiHints>({});
  useEffect(() => {
    if (!userId) return;
    const stored = readLocalHints(getLocalStorage(), userId);
    localRef.current = stored;
    setLocal(stored);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const onChanged = (event: Event) => {
      const { userId: from, key, record: changed } = (event as CustomEvent<ChangedDetail>).detail;
      if (from !== userId) return;
      const next: UiHints = { ...localRef.current, [key]: mergeRecords(localRef.current[key], changed) };
      localRef.current = next;
      setLocal(next);
    };
    window.addEventListener(CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(CHANGED_EVENT, onChanged);
  }, [userId]);

  const preferences = profile.data?.preferences;
  const serverReady = profile.isSuccess && typeof preferences === "object" && preferences !== null;
  const server = useMemo(() => parseUiHints(preferences?.ui_hints) ?? {}, [preferences]);
  const hints = useMemo(() => mergeHints(server, local ?? {}), [server, local]);

  const hintsRef = useRef(hints);
  hintsRef.current = hints;

  const record = useCallback(
    (key: UiHintKey, patch: UiHintRecord) => {
      if (!userId || isImpersonating) return;
      const next = mergeRecords(hintsRef.current[key], patch);

      const nextLocal: UiHints = { ...localRef.current, [key]: mergeRecords(localRef.current[key], next) };
      localRef.current = nextLocal;
      setLocal(nextLocal);
      writeLocalHints(getLocalStorage(), userId, nextLocal);
      window.dispatchEvent(new CustomEvent<ChangedDetail>(CHANGED_EVENT, { detail: { userId, key, record: next } }));

      updateProfileMe({ preferences: { ui_hints: { [key]: next } } })
        .then((response) => queryClient.setQueryData(["profile-me"], response))
        .catch(() => {
          // The local mirror already holds it; the next visit retries the sync.
        });
    },
    [userId, isImpersonating, queryClient],
  );

  return { hints, ready: serverReady && local !== null && !isImpersonating, record };
}
