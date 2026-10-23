"use client";

import { useEffect, useRef, useState } from "react";

import { CoachingConfirmDialog } from "@/components/coaching/CoachingConfirmDialog";
import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  earlyEndConfirmText,
  earlyEndIncomingLine,
  earlyEndIncomingText,
  earlyEndIncomingTitle,
  earlyEndWaitingText,
  type EarlyEndView,
  type PostSessionRoleName,
} from "@/lib/coachingEarlyEnd";

/**
 * "Birlikte bitir" in the coaching room. Two pieces: a part of the room's panel
 * (the button, the waiting line, the cooldown) and the question put to the one
 * who is asked, which comes over the call whatever the panel is doing. Both draw
 * from a view the page works out (`earlyEndView`), so neither decides anything.
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */

export function EarlyEndPanelSection({
  view,
  otherName,
  role,
  isPending,
  error,
  onAsk,
  onWithdraw,
}: {
  view: EarlyEndView;
  otherName: string | null | undefined;
  /** For the word used when the other person has no name. */
  role?: PostSessionRoleName;
  isPending: boolean;
  /** A failed call, in words. Shown in the question while it is open, here otherwise. */
  error: string | null;
  onAsk: () => void;
  onWithdraw: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canAsk = view.kind === "idle";

  // Once the request is out (or the other side's has come in) the question is over.
  useEffect(() => {
    if (view.kind !== "idle") setConfirmOpen(false);
  }, [view.kind]);

  if (view.kind === "hidden") return null;

  const notice = view.kind === "idle" || view.kind === "cooldown" ? view.notice : null;

  return (
    <div>
      <h2 className="text-body font-medium text-ink">Görüşmeyi birlikte bitir</h2>
      <p className="mt-1 text-small text-ink-mid">
        Görüşmeyi erken bitirmek istersen karşı tarafa sorabilirsin. Kabul ederse görüşme tamamlanmış sayılır.
      </p>

      {view.kind === "waiting" ? (
        <div className="mt-3">
          <div role="status" className="rounded-card border border-line p-3">
            <p className="text-small font-medium text-ink">Yanıt bekleniyor</p>
            <p className="mt-1 text-small text-ink-mid">{earlyEndWaitingText(otherName, role)}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 min-h-11"
            disabled={isPending}
            onClick={onWithdraw}
          >
            İsteği geri çek
          </Button>
        </div>
      ) : null}

      {view.kind === "incoming" ? (
        <p role="status" className="mt-3 rounded-card border border-line p-3 text-small text-ink">
          {earlyEndIncomingLine(otherName, role ?? "student")}
        </p>
      ) : null}

      {view.kind === "idle" || view.kind === "cooldown" ? (
        <div className="mt-3">
          {notice ? (
            <p role="status" className="mb-3 rounded-card border border-line p-3 text-small text-ink">
              {notice}
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11"
            disabled={view.kind === "cooldown" || isPending}
            onClick={() => setConfirmOpen(true)}
          >
            Birlikte bitir
          </Button>
          {view.kind === "cooldown" ? <p className="mt-2 text-small text-ink-mid">{view.label}</p> : null}
        </div>
      ) : null}

      {confirmOpen ? null : <InlineError message={error} className="mt-3" />}

      <CoachingConfirmDialog
        open={confirmOpen && canAsk}
        title="Görüşmeyi birlikte bitirmek istiyor musun?"
        description={earlyEndConfirmText(otherName, role)}
        confirmLabel="İste"
        tone="default"
        isPending={isPending}
        onConfirm={onAsk}
        onCancel={() => setConfirmOpen(false)}
      >
        <InlineError message={error} size="sm" />
      </CoachingConfirmDialog>
    </div>
  );
}

/**
 * The question put to the one who is asked, over the call. Both buttons are
 * answers: dismissing it (Escape, a tap outside) is "Devam et", as the lesson's
 * own prompt does, so the meeting is never ended by walking past a window.
 * It opens on "Devam et", so a stray Enter cannot end a meeting.
 */
export function EarlyEndIncomingDialog({
  view,
  role,
  otherName,
  isPending,
  error,
  onAccept,
  onContinue,
}: {
  view: EarlyEndView;
  role: PostSessionRoleName;
  otherName: string | null | undefined;
  isPending: boolean;
  error: string | null;
  onAccept: () => void;
  onContinue: () => void;
}) {
  const continueRef = useRef<HTMLButtonElement>(null);
  const incoming = view.kind === "incoming" ? view : null;

  return (
    <Dialog
      open={incoming !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) onContinue();
      }}
    >
      <DialogContent
        showClose={false}
        className="w-[calc(100dvw-2rem)] max-w-md rounded-modal border-line bg-surface p-6 text-ink shadow-float sm:p-7"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          continueRef.current?.focus();
        }}
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-xl font-bold tracking-[-0.02em]">
            {earlyEndIncomingTitle(role, otherName)}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-ink-mid">
            {incoming ? earlyEndIncomingText({ role, otherName, minute: incoming.minute }) : ""}
          </DialogDescription>
        </DialogHeader>
        <InlineError message={error} size="sm" />
        <DialogFooter className="mt-2 flex-col-reverse gap-3 sm:flex-row sm:space-x-0">
          <Button
            ref={continueRef}
            type="button"
            variant="outline"
            className="min-h-11 sm:min-w-32"
            disabled={isPending}
            onClick={onContinue}
          >
            Devam et
          </Button>
          <Button type="button" className="min-h-11 sm:min-w-40" disabled={isPending} onClick={onAccept}>
            Kabul et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
