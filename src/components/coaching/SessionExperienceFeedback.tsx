"use client";

import { useId, useState } from "react";
import { X } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  COACHING_EXPERIENCE_COMMENT_MAX,
  COACHING_EXPERIENCE_REASON_LABELS,
  coachingExperienceFeedbackKey,
  extractCoachingErrorMessage,
  fetchCoachingExperienceFeedback,
  submitCoachingExperienceFeedback,
  type CoachingExperienceRating,
} from "@/lib/coachingApi";

const OPTIONS: { rating: CoachingExperienceRating; label: string }[] = [
  { rating: "bad", label: "Kötü" },
  { rating: "ok", label: "İdare eder" },
  { rating: "good", label: "İyi" },
];

function dismissKey(sessionId: string) {
  return `hocam:coaching-experience-feedback-dismissed:${sessionId}`;
}

// Storage can be missing or throw (private window, blocked site data): the strip
// must still work, it just may come back on a return visit.
function wasDismissed(sessionId: string): boolean {
  try {
    return window.localStorage.getItem(dismissKey(sessionId)) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed(sessionId: string) {
  try {
    window.localStorage.setItem(dismissKey(sessionId), "1");
  } catch {
    /* nothing to remember it with */
  }
}

/**
 * "Bu görüşmede sistem nasıldı?" after a coaching meeting, for either side.
 * Three plain boxes, no colour: İyi is sent at once, Kötü and İdare eder open the
 * reasons (which ones the server gave for this role) and an optional short note.
 * It rates the platform, never the coach (that is "Görüşmeyi değerlendir").
 *
 * The server decides whether to ask at all, so with its flag off, before it is
 * deployed (404) or for a meeting nobody is asked about, nothing is drawn. Plain
 * class strings: tailwind-merge would drop a named size next to a colour.
 */
export function SessionExperienceFeedback({ sessionId }: { sessionId: string }) {
  const noteId = useId();
  const [rating, setRating] = useState<CoachingExperienceRating | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [closed, setClosed] = useState(() => wasDismissed(sessionId));

  const stateQuery = useQuery({
    queryKey: coachingExperienceFeedbackKey(sessionId),
    queryFn: () => fetchCoachingExperienceFeedback(sessionId),
    retry: false,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (answer: { rating: CoachingExperienceRating; reasons: string[]; comment: string }) =>
      submitCoachingExperienceFeedback(sessionId, answer),
    onSuccess: () => setDone(true),
    onError: (error) => toast.error(extractCoachingErrorMessage(error)),
  });

  if (done) {
    return (
      <p
        role="status"
        className="rounded-card border border-line bg-surface px-4 py-4 text-body text-ink sm:px-6"
      >
        Teşekkürler, cevabın alındı.
      </p>
    );
  }
  if (closed || !stateQuery.data?.ask) return null;

  const pick = (next: CoachingExperienceRating) => {
    if (mutation.isPending) return;
    if (next === "good") {
      setRating(next);
      mutation.mutate({ rating: next, reasons: [], comment: "" });
      return;
    }
    setRating(next);
  };
  const toggleReason = (key: string) =>
    setReasons((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  const close = () => {
    rememberDismissed(sessionId);
    setClosed(true);
  };
  const askWhy = rating === "bad" || rating === "ok";
  const reasonKeys = stateQuery.data.reasons ?? [];

  return (
    <section aria-label="Sistem geri bildirimi" className="rounded-card border border-line bg-surface px-4 py-4 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-body font-medium text-ink">Bu görüşmede sistem nasıldı?</h2>
        <button
          type="button"
          aria-label="Kapat"
          onClick={close}
          className="-mr-2 -mt-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-ink-mid hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <div role="group" aria-label="Sistem nasıldı?" className="mt-3 grid grid-cols-3 gap-2">
        {OPTIONS.map(({ rating: value, label }) => {
          const selected = rating === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              disabled={mutation.isPending}
              onClick={() => pick(value)}
              className={`min-h-11 rounded-card border bg-surface px-2 py-3 text-body text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 disabled:opacity-60 ${
                selected ? "border-ink font-medium" : "border-line hover:border-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {askWhy ? (
        <div className="mt-4 space-y-4">
          <div role="group" aria-labelledby={`${noteId}-why`} className="space-y-2">
            <p id={`${noteId}-why`} className="text-small text-ink-mid">
              Neyi düzeltelim?
            </p>
            <div className="flex flex-wrap gap-2">
              {reasonKeys.map((key) => {
                const selected = reasons.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleReason(key)}
                    className={`min-h-11 rounded-pill border px-4 text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 ${
                      selected ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink hover:border-ink"
                    }`}
                  >
                    {COACHING_EXPERIENCE_REASON_LABELS[key] ?? key}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor={noteId} className="block text-label font-medium text-ink">
              İstersen kısaca yaz
            </label>
            <Textarea
              id={noteId}
              className="min-h-20"
              maxLength={COACHING_EXPERIENCE_COMMENT_MAX}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <p className="text-small text-ink-mid">Notta kişisel bilgi (telefon, adres gibi) yazma.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11"
            disabled={mutation.isPending}
            onClick={() => rating && mutation.mutate({ rating, reasons, comment: comment.trim() })}
          >
            Gönder
          </Button>
        </div>
      ) : null}
    </section>
  );
}
