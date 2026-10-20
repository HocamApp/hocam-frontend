"use client";

import { useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";
import {
  acceptCoachingTimeProposal,
  createCoachingTimeRequest,
  declineCoachingTimeProposal,
  extractCoachingErrorMessage,
  fetchCoachingTimeRequests,
  withdrawCoachingTimeRequest,
} from "@/lib/coachingApi";
import { buildTimeRequestRows, type ScheduleRequestRow } from "@/lib/coachingStudentSchedule";

const TEXT_BUTTON =
  "min-h-11 text-small font-medium text-ink underline underline-offset-4 disabled:text-ink-mid";

/**
 * "Uygun saat bulamadın mı?" (master spec §16.5): the 48-hour fallback, as one
 * short card with a row per slot instead of the same card repeated. The
 * student never proposes a time here; they ask the tutor for one, then accept
 * or decline what comes back. An accepted hour only counts once the student
 * confirms the whole choice, the same "confirm is the only way to finish"
 * rule the server enforces.
 */
export function ScheduleTimeRequests({
  requiredCount,
  lockedIndexes,
  selectedIndexes,
}: {
  requiredCount: number;
  lockedIndexes: number[];
  selectedIndexes: number[];
}) {
  const queryClient = useQueryClient();
  const headingId = useId();
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["coaching-time-requests"],
    queryFn: fetchCoachingTimeRequests,
  });

  const rows = useMemo(
    () =>
      buildTimeRequestRows({
        requiredCount,
        lockedIndexes,
        selectedIndexes,
        requests: query.data ?? [],
      }),
    [requiredCount, lockedIndexes, selectedIndexes, query.data],
  );

  const refresh = () => {
    setError(null);
    queryClient.invalidateQueries({ queryKey: ["coaching-time-requests"] });
    queryClient.invalidateQueries({ queryKey: ["coaching-scheduling-slots"] });
  };
  const failed = (err: unknown) => setError(extractCoachingErrorMessage(err));

  const create = useMutation({
    mutationFn: (params: { slotIndex: number; note: string }) => createCoachingTimeRequest(params),
    onSuccess: refresh,
    onError: failed,
  });
  const withdraw = useMutation({
    mutationFn: (requestId: string) => withdrawCoachingTimeRequest(requestId),
    onSuccess: refresh,
    onError: failed,
  });
  const accept = useMutation({
    mutationFn: (proposalId: string) => acceptCoachingTimeProposal(proposalId),
    onSuccess: () => {
      refresh();
      toast.success("Öneriyi kabul ettin. Şimdi saatleri onaylayabilirsin.");
    },
    onError: failed,
  });
  const decline = useMutation({
    mutationFn: (proposalId: string) => declineCoachingTimeProposal(proposalId),
    onSuccess: refresh,
    onError: failed,
  });
  const busy = create.isPending || withdraw.isPending || accept.isPending || decline.isPending;

  if (query.isLoading) return null;
  if (!query.isError && rows.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="rounded-card border border-line bg-surface p-5">
      <h2 id={headingId} className="text-body font-medium text-ink">
        Uygun saat bulamadın mı?
      </h2>
      <p className="mt-1 text-small text-ink-mid">
        Hocandan saat iste; 48 saat içinde yanıt verir. Ortak saat çıkmazsa koçluk iptal olur, ders paketin
        etkilenmez.
      </p>

      {query.isError ? (
        <div className="mt-3">
          <CoachingLoadError
            message="Saat talepleri yüklenemedi."
            onRetry={() => query.refetch()}
            isRetrying={query.isFetching}
          />
        </div>
      ) : (
        <ul aria-label="Saat talepleri" className="mt-3 divide-y divide-line">
          {rows.map((row) => (
            <RequestRow
              key={row.slotIndex}
              row={row}
              busy={busy}
              sending={create.isPending && create.variables?.slotIndex === row.slotIndex}
              onCreate={(note) => create.mutate({ slotIndex: row.slotIndex, note })}
              onWithdraw={(requestId) => withdraw.mutate(requestId)}
              onAccept={(proposalId) => accept.mutate(proposalId)}
              onDecline={(proposalId) => decline.mutate(proposalId)}
            />
          ))}
        </ul>
      )}

      <InlineError message={error} className="mt-3" />
    </section>
  );
}

function RequestRow({
  row,
  busy,
  sending,
  onCreate,
  onWithdraw,
  onAccept,
  onDecline,
}: {
  row: ScheduleRequestRow;
  busy: boolean;
  sending: boolean;
  onCreate: (note: string) => void;
  onWithdraw: (requestId: string) => void;
  onAccept: (proposalId: string) => void;
  onDecline: (proposalId: string) => void;
}) {
  const noteId = useId();
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <span className="text-body font-medium text-ink">{row.label}</span>
          {row.kind === "waiting" ? (
            <>
              {" "}
              <span className="text-body text-ink">Öneri bekleniyor</span>
              <p className="text-small text-ink-mid">{`Son yanıt: ${row.answerBy}`}</p>
            </>
          ) : null}
          {row.kind === "matched" ? (
            <>
              {" "}
              <span className="text-body text-ink">Ortak saat bulundu</span>
            </>
          ) : null}
          {row.kind === "proposal" ? (
            <>
              {row.proposals.map((proposal) => (
                <p key={proposal.id} className="text-body text-ink">
                  {`Hocan ${proposal.when} önerdi`}
                </p>
              ))}
              <p className="text-small text-ink-mid">{`Son yanıt: ${row.answerBy}`}</p>
            </>
          ) : null}
        </div>

        {row.kind === "ask" && !asking ? (
          <Button
            type="button"
            size="sm"
            variant="gold"
            className="min-h-11"
            aria-label={`${row.label} için saat iste`}
            onClick={() => setAsking(true)}
          >
            Saat iste
          </Button>
        ) : null}

        {row.kind === "waiting" ? (
          <button type="button" className={TEXT_BUTTON} disabled={busy} onClick={() => onWithdraw(row.requestId)}>
            Talebi geri çek
          </button>
        ) : null}

        {row.kind === "proposal"
          ? row.proposals.map((proposal) => (
              <div key={proposal.id} className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="min-h-11"
                  disabled={busy}
                  onClick={() => onAccept(proposal.id)}
                >
                  Kabul et
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  disabled={busy}
                  onClick={() => onDecline(proposal.id)}
                >
                  Reddet
                </Button>
              </div>
            ))
          : null}
      </div>

      {row.kind === "ask" && asking ? (
        <div className="mt-3 space-y-2">
          <label htmlFor={noteId} className="text-small font-medium text-ink">
            Hocana not (isteğe bağlı)
          </label>
          <textarea
            id={noteId}
            value={note}
            rows={2}
            placeholder="Örnek: Hafta içi akşamları uygunum"
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-input border border-line bg-surface p-3 text-body text-ink"
          />
          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              size="sm"
              variant="gold"
              className="min-h-11"
              disabled={busy}
              onClick={() => onCreate(note.trim())}
            >
              {sending ? "Gönderiliyor…" : "Talebi gönder"}
            </Button>
            <button type="button" className={TEXT_BUTTON} onClick={() => setAsking(false)}>
              Vazgeç
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
