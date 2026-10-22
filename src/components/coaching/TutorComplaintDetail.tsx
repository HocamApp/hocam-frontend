"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { InlineError } from "@/components/shared/InlineError";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ShakeOnError } from "@/components/shared/ShakeOnError";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  COACHING_FAZ8_QUERY_KEYS,
  COACHING_SESSION_QUERY_KEYS,
  fetchTutorCoachingDispute,
  fetchTutorCoachingDisputeEvidenceAccessUrl,
  fetchTutorCoachingSessions,
  respondToTutorCoachingDispute,
} from "@/lib/coachingApi";
import { buildTutorComplaint, type ComplaintPathStep } from "@/lib/coachingTutorComplaints";

const LIST_HREF = "/dashboard/tutor/coaching/reports";
const REPLY_MAX = 2000;
const LINK =
  "inline-flex min-h-11 items-center text-small font-medium text-ink underline underline-offset-4 hover:text-pink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:text-ink-mid";
const CARD = "space-y-3 rounded-card border border-line bg-surface p-5";

function isNotFound(error: unknown): boolean {
  return (error as { response?: { status?: number } } | null)?.response?.status === 404;
}

const STATE_WORD: Record<ComplaintPathStep["state"], string> = {
  done: ", tamam",
  current: ", şu an burada",
  todo: ", bekliyor",
};

/** Filed, in review, decided, over: where the complaint is, with a pink dot for what is behind it and in front of it grey. */
function WayCard({ steps, note }: { steps: ComplaintPathStep[]; note: string | null }) {
  return (
    <section aria-label="Bildirimin yolu" className={CARD}>
      <ol aria-label="Bildirimin durumu" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-small">
        {steps.map((step, index) => (
          <li
            key={step.key}
            aria-current={step.state === "current" ? "step" : undefined}
            className="flex items-center gap-x-3"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-pill ${step.state === "todo" ? "bg-line" : "bg-pink"}`}
              />
              <span className={step.state === "current" ? "font-bold text-ink" : step.state === "done" ? "font-medium text-ink" : "text-ink-mid"}>
                {step.label}
              </span>
              <span className="sr-only">{STATE_WORD[step.state]}</span>
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="text-ink-mid">
                —
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      {note ? <p className="text-small text-ink-mid">{note}</p> : null}
    </section>
  );
}

function EvidenceCard({ items }: { items: { id: string; name: string }[] }) {
  const open = useMutation({
    mutationFn: fetchTutorCoachingDisputeEvidenceAccessUrl,
    onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer"),
  });
  return (
    <section aria-label="Kanıtlar" className={CARD}>
      <h2 className="text-body font-bold text-ink">Kanıtlar</h2>
      {items.length === 0 ? (
        <p className="text-small text-ink-mid">Sana açılmış kanıt yok.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="min-w-0 break-words text-small text-ink">
                {item.name} <span className="text-ink-mid">· Destek ekibi sana açtı</span>
              </span>
              <button
                type="button"
                className={LINK}
                aria-label={`${item.name} dosyasını görüntüle`}
                disabled={open.isPending}
                onClick={() => open.mutate(item.id)}
              >
                Görüntüle
              </button>
            </li>
          ))}
        </ul>
      )}
      <InlineError size="sm" message={open.error ? "Dosya görüntülenemedi. Biraz sonra tekrar dene." : null} />
    </section>
  );
}

/** What the tutor already said, and, while the complaint is open, a box for more. What is sent is seen by the student too and cannot be taken back. */
function ReplyCard({
  disputeId,
  replies,
  reply,
}: {
  disputeId: string;
  replies: { when: string; body: string }[];
  reply: { open: boolean; closedNote: string | null };
}) {
  const client = useQueryClient();
  const boxId = useId();
  const [body, setBody] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [shakes, setShakes] = useState(0);
  const send = useMutation({
    mutationFn: (text: string) => respondToTutorCoachingDispute(disputeId, text),
    onSuccess: async () => {
      setBody("");
      await client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDispute(disputeId) });
      client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDisputes() });
    },
    onError: () => {
      setProblem("Yanıt gönderilemedi. Tekrar dene.");
      setShakes((count) => count + 1);
    },
  });

  const submit = () => {
    const text = body.trim();
    if (!text) {
      setProblem("Yanıtını yaz.");
      setShakes((count) => count + 1);
      return;
    }
    setProblem(null);
    send.mutate(text);
  };

  return (
    <section aria-labelledby={`${boxId}-title`} className={CARD}>
      <h2 id={`${boxId}-title`} className="text-body font-bold text-ink">
        Yanıtın
      </h2>
      {replies.length > 0 ? (
        <div className="space-y-3">
          {replies.map((item, index) => (
            <div key={`${item.when}-${index}`}>
              <p className="text-small tabular-nums text-ink-mid">{item.when}</p>
              <p className="whitespace-pre-wrap text-body text-ink">{item.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {reply.open ? (
        <ShakeOnError trigger={shakes}>
          <div className="space-y-2">
            <label htmlFor={boxId} className="block text-small font-medium text-ink">
              Yanıt metni
            </label>
            <p className="text-small text-ink-mid">Yazdığın öğrenci ve destek ekibi tarafından görülür, sonra silinemez.</p>
            <Textarea
              id={boxId}
              rows={5}
              maxLength={REPLY_MAX}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-[8rem] bg-surface text-body text-ink focus-visible:border-ink focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <p className="text-right text-label tabular-nums text-ink-mid">{`${body.length} / ${REPLY_MAX}`}</p>
            <InlineError size="sm" message={problem} />
            <Button type="button" size="sm" variant="gold" className="min-h-11" disabled={send.isPending} onClick={submit}>
              {send.isPending ? "Gönderiliyor…" : "Yanıtı gönder"}
            </Button>
          </div>
        </ShakeOnError>
      ) : (
        <p className="text-small text-ink-mid">{reply.closedNote}</p>
      )}
    </section>
  );
}

/**
 * One complaint against the tutor: what it is about and which meeting, where it
 * stands on its way from filed to closed, the process with its dates, the result
 * once the review has decided, the evidence staff opened to the tutor, and the
 * tutor's answers. The student's own words are kept from the tutor by the server
 * and are not asked for here.
 */
export function TutorComplaintDetail({ disputeId }: { disputeId: string }) {
  const query = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDispute(disputeId),
    queryFn: () => fetchTutorCoachingDispute(disputeId),
  });
  // Only for the meeting's number and date: without it the page still points at the meeting.
  const sessionsQuery = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.tutorList(),
    queryFn: fetchTutorCoachingSessions,
    staleTime: 60_000,
  });
  const model = useMemo(
    () => (query.data ? buildTutorComplaint(query.data, sessionsQuery.data ?? []) : null),
    [query.data, sessionsQuery.data]
  );

  if (query.isLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (query.isError && !isNotFound(query.error)) {
    return (
      <CoachingLoadError
        message="Sorun bildirimi yüklenemedi."
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }
  if (!query.data || !model) {
    return (
      <CoachingEmptyState
        title="Sorun bildirimi bulunamadı"
        description="Bu kayıt artık erişilebilir değil veya sana ait değil."
      />
    );
  }

  return (
    <div className="space-y-4">
      <section aria-label="Bildirim özeti" className="space-y-1">
        <Link href={LIST_HREF} className={LINK}>
          Kayıtlar&apos;a dön
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-h3-m font-bold text-ink md:text-h3 md:font-bold">{model.title}</h2>
            <p className="text-small tabular-nums text-ink-mid">
              {model.whenLabel}
              {model.session?.label ? ` · ${model.session.label}` : ""}
              {model.session ? (
                <>
                  {" · "}
                  <Link href={model.session.href} className="font-medium text-ink underline underline-offset-4 hover:text-pink-deep">
                    Görüşmeye git
                  </Link>
                </>
              ) : null}
            </p>
          </div>
          <span className="inline-flex shrink-0 rounded-pill border border-ink px-3 py-0.5 text-[0.8125rem] font-medium text-ink">
            {model.statusLabel}
          </span>
        </div>
        <p className="text-small text-ink-mid">
          Öğrencinin açıklaması gizlidir; sana yalnız konu, süreç ve açılan kanıtlar gösterilir.
        </p>
      </section>

      <WayCard steps={model.path.steps} note={model.path.note} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="space-y-4">
          {model.result ? (
            <section aria-label="İnceleme sonucu" className={CARD}>
              <p className="text-small text-ink-mid">İnceleme sonucu</p>
              <p className="text-body font-bold text-ink">{model.result.meritLabel}</p>
              <p className="text-small text-ink-mid">Karar tarihi</p>
              <p className="text-small font-medium tabular-nums text-ink">{model.result.whenLabel}</p>
            </section>
          ) : null}

          <section aria-label="Süreç" className={CARD}>
            <h2 className="text-body font-bold text-ink">Süreç</h2>
            {model.steps.length > 0 ? (
              <ol className="space-y-2">
                {model.steps.map((step, index) => (
                  <li key={`${step.when}-${index}`} className="flex flex-col gap-x-4 sm:flex-row">
                    <span className="shrink-0 text-small tabular-nums text-ink-mid sm:w-44">{step.when}</span>
                    <span className="text-small text-ink">{step.text}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-small text-ink-mid">Süreç adımları burada görünecek.</p>
            )}
          </section>

          <EvidenceCard items={model.evidence} />
        </div>

        <ReplyCard disputeId={disputeId} replies={model.replies} reply={model.reply} />
      </div>
    </div>
  );
}
