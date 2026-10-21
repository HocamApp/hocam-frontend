"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { CaretDown } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CoachingIncidentDialogs } from "@/components/coaching/CoachingIncidentActions";
import { CoachingSessionRatingForm } from "@/components/coaching/CoachingSessionRatingForm";
import { useCoachingIncidentReports } from "@/components/coaching/useCoachingIncidentReports";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  COACHING_SESSION_QUERY_KEYS,
  RATING_CRITERIA,
  extractCoachingErrorMessage,
  submitCoachingSessionRating,
  type CoachingSessionRatingScores,
} from "@/lib/coachingApi";
import { TUTOR_NO_SHOW_WAIT_MINUTES, type TutorNoShowOption } from "@/lib/coachingPostSession";

/**
 * The pieces of the screen after a coaching meeting. Pink is the meeting that
 * just was, the white card under it holds the options (Master Spec §24 names
 * five, so the count never grows), and what needs a decision opens only when
 * pressed. Plain class strings throughout: tailwind-merge would drop a named
 * size next to a colour.
 */

/** A row's action: solid gold, the action colour of a row on a white surface. */
export function PostSessionGoldLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button asChild size="sm" variant="gold" className="min-h-11">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

/** An action on the pink band: solid ink, so it never shares the colour behind it. */
export function PostSessionInkLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button asChild size="sm" className="min-h-11 bg-ink text-paper hover:bg-ink/90">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

/** The meeting on a pink band: what happened, the one sentence, which meeting it was, and the report deadline. */
export function PostSessionBand({
  title,
  message,
  meta,
  deadline,
  action,
}: {
  title: string;
  message: string;
  meta: string;
  deadline: string | null;
  /** Rides on the band, e.g. a solid ink "Odaya geri dön". */
  action?: ReactNode;
}) {
  return (
    <section
      aria-label="Görüşme"
      className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-card bg-pink px-6 py-5 text-primary-foreground"
    >
      <div className="min-w-0 flex-1 basis-64">
        {/* `md:font-bold` is not redundant: `md:text-h3` carries its own weight of 500. */}
        <h1 className="text-h3-m font-bold md:text-h3 md:font-bold">{title}</h1>
        {message ? <p className="mt-1 text-body">{message}</p> : null}
        <p className="mt-3 text-small tabular-nums">{meta}</p>
        {deadline ? (
          <p className="mt-2">
            <span className="block text-label">Son tarih</span>
            <span className="block text-small font-medium tabular-nums">{deadline}</span>
          </p>
        ) : null}
      </div>
      {action}
    </section>
  );
}

/** One option of the card: what it is, a line on it, and its one action. */
export function PostSessionRow({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line px-4 py-4 first:border-t-0 sm:px-6">
      <div className="min-w-0 flex-1 basis-56">
        <h2 className="text-body font-medium text-ink">{title}</h2>
        {caption ? <p className="text-small text-ink-mid">{caption}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** An option that opens in place: what is inside, and how much has been done, before it is opened. */
export function PostSessionDisclosure({
  id,
  title,
  caption,
  count,
  open,
  onToggle,
  keepMounted = false,
  children,
}: {
  id: string;
  title: string;
  caption?: string;
  count?: string;
  open: boolean;
  onToggle: () => void;
  /** Keeps what is inside (a half-filled form) alive while the row is closed. */
  keepMounted?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-line first:border-t-0">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-6"
        >
          <span className="min-w-0">
            <span className="block text-body font-medium text-ink">{title}</span>
            {caption ? <span className="block text-small text-ink-mid">{caption}</span> : null}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-small tabular-nums text-ink-mid">
            {count}
            <CaretDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-[--duration-state] ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>
      </h2>
      {open || keepMounted ? (
        <div id={`${id}-panel`} hidden={!open} className="px-4 pb-5 sm:px-6">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * "Görüşmeyi değerlendir": open for a student who has not rated, with the seven
 * criteria and a count of the answered ones; a thank-you once rated. The form
 * stays alive while the row is closed, so closing it loses nothing.
 */
export function PostSessionRatingRow({ sessionId, state }: { sessionId: string; state: "open" | "done" }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [answered, setAnswered] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ scores, comment }: { scores: CoachingSessionRatingScores; comment: string }) =>
      submitCoachingSessionRating(sessionId, scores, comment),
    onSuccess: () => {
      toast.success("Değerlendirmen kaydedildi.");
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.studentList() });
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  if (state === "done" || submitted) {
    return <PostSessionRow title="Görüşmeyi değerlendir" caption="Değerlendirmen alındı, teşekkürler." />;
  }

  return (
    <PostSessionDisclosure
      id="degerlendirme"
      title="Görüşmeyi değerlendir"
      caption="7 kısa ölçüt, her biri tek dokunuş"
      count={`${answered} / ${RATING_CRITERIA.length}`}
      open={open}
      onToggle={() => setOpen((value) => !value)}
      keepMounted
    >
      <CoachingSessionRatingForm
        isPending={mutation.isPending}
        onProgress={setAnswered}
        onSubmit={(scores, comment) => mutation.mutate({ scores, comment })}
      />
    </PostSessionDisclosure>
  );
}

/**
 * "Bir sorun mu oldu?": the technical report, and the tutor's absence only when
 * `noShow` says it can be reported. Each asks once before it closes the meeting.
 */
export function PostSessionProblems({ sessionId, noShow }: { sessionId: string; noShow: TutorNoShowOption }) {
  const reports = useCoachingIncidentReports({ sessionId, viewerRole: "student" });
  const [open, setOpen] = useState(false);
  const noteId = useId();

  return (
    <>
      <PostSessionDisclosure
        id="sorun"
        title="Bir sorun mu oldu?"
        caption={noShow.kind === "hidden" ? "Teknik sorun bildirebilirsin" : "Teknik sorun ya da öğretmenin katılmaması"}
        open={open}
        onToggle={() => setOpen((value) => !value)}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={noteId} className="block text-label font-medium text-ink">
              Kısa not (isteğe bağlı)
            </label>
            <Textarea
              id={noteId}
              className="min-h-20"
              value={reports.note}
              onChange={(event) => reports.setNote(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="gold"
              className="min-h-11"
              disabled={reports.isPending}
              onClick={() => reports.setPending("technical")}
            >
              Teknik sorun bildir
            </Button>
            {noShow.kind === "available" ? (
              <Button
                type="button"
                size="sm"
                variant="gold"
                className="min-h-11"
                disabled={reports.isPending}
                onClick={() => reports.setPending("no_show")}
              >
                Öğretmen katılmadı bildir
              </Button>
            ) : null}
          </div>
          {noShow.kind === "available" ? <p className="text-small text-ink-mid">{reports.consequence}</p> : null}
          {noShow.kind === "later" ? (
            <p className="text-small text-ink-mid">
              {`Öğretmen katılmadı bildirimi görüşmenin ${TUTOR_NO_SHOW_WAIT_MINUTES}. dakikasından sonra yapılabilir (${noShow.opensAt}).`}
            </p>
          ) : null}
        </div>
      </PostSessionDisclosure>
      <CoachingIncidentDialogs reports={reports} noShowLabel="Öğretmen katılmadı" />
    </>
  );
}
