"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export const GOOGLE_CALENDAR_RESULT_PARAM = "google_calendar";

export type GoogleCalendarCallbackResult = "connected" | "error" | "invalid_state";

type ToastKind = "success" | "error";

export interface GoogleCalendarCallbackToast {
  kind: ToastKind;
  message: string;
}

/**
 * Messages are deliberately generic: the OAuth failure reason may reference
 * the tutor's Google account, so it never reaches the UI.
 */
export function googleCalendarCallbackToast(
  result: string | null
): GoogleCalendarCallbackToast | null {
  switch (result) {
    case "connected":
      return {
        kind: "success",
        message: "Google Calendar bağlantın tamamlandı.",
      };
    case "error":
      return {
        kind: "error",
        message: "Google Calendar bağlantısı tamamlanamadı. Lütfen yeniden dene.",
      };
    case "invalid_state":
      return {
        kind: "error",
        message:
          "Bağlantı oturumun geçersiz veya süresi dolmuş. Lütfen yeniden başlat.",
      };
    default:
      return null;
  }
}

/**
 * Removes only the callback marker, keeping every other query parameter
 * (learning_goal_id, discovery_impression_id, …) intact.
 */
export function stripGoogleCalendarParam(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(GOOGLE_CALENDAR_RESULT_PARAM);
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}

/**
 * Surfaces the OAuth callback outcome once, then cleans the URL so a refresh
 * or a shared link does not replay the toast.
 */
export function useGoogleCalendarCallbackResult(onConnected?: () => void): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  const result = searchParams.get(GOOGLE_CALENDAR_RESULT_PARAM);
  const search = searchParams.toString();

  useEffect(() => {
    if (!result || handled.current) {
      return;
    }
    handled.current = true;

    const feedback = googleCalendarCallbackToast(result);
    if (feedback) {
      if (feedback.kind === "success") {
        toast.success(feedback.message);
        onConnected?.();
      } else {
        toast.error(feedback.message);
      }
    }

    router.replace(`${pathname}${stripGoogleCalendarParam(search)}`, {
      scroll: false,
    });
    // onConnected is intentionally excluded: it must not re-trigger the toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, search, pathname, router]);
}
