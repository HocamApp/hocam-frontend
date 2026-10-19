"use client";

import { useId, useRef, useState } from "react";
import {
  ArrowsClockwise,
  Check,
  ClockCountdown,
  Minus,
  UserPlus,
  X,
  type Icon,
} from "@phosphor-icons/react";

import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { InlineError } from "@/components/shared/InlineError";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { COACHING_DAY_LABEL } from "@/lib/coachingApi";
import type {
  AcceptanceInboxItem,
  AnsweredRow,
  CoachingInboxItem,
  RescheduleInboxItem,
  TimeInboxItem,
} from "@/lib/coachingInbox";
import { CoachingConfirmDialog } from "./CoachingConfirmDialog";

export interface CoachingInboxActions {
  onAccept: (requestId: string) => void;
  onRejectAcceptance: (requestId: string, note: string) => void;
  onPropose: (requestId: string, dayOfWeek: number, startTime: string) => void;
  onApprove: (requestId: string, grantFree: boolean) => void;
  onRejectReschedule: (requestId: string) => void;
  /** A request is in flight: every decision is locked. */
  busy: boolean;
  /** A refused decision, shown above the card. */
  error: string | null;
}

const KIND_LABEL = {
  acceptance: "Koçluk talebi",
  time: "Saat isteği",
  reschedule: "Saat değişikliği",
} as const;

const KIND_ICON: Record<CoachingInboxItem["kind"], Icon> = {
  acceptance: UserPlus,
  time: ClockCountdown,
  reschedule: ArrowsClockwise,
};

const OUTCOME_ICON = { accepted: Check, declined: X, other: Minus } as const;

function RowIcon({ icon: IconComponent }: { icon: Icon }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-line bg-paper text-ink"
    >
      <IconComponent className="h-5 w-5" />
    </span>
  );
}

function AcceptanceBody({
  item,
  actions,
}: {
  item: AcceptanceInboxItem;
  actions: CoachingInboxActions;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  return (
    <>
      <dl className="divide-y divide-line rounded-input border border-line bg-paper text-small">
        {item.lines.map((line) => (
          <div key={line.label} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-4 py-3">
            <dt className="text-ink-mid">{line.label}</dt>
            <dd className="font-bold tabular-nums text-ink">{line.amount}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" disabled={actions.busy} onClick={() => actions.onAccept(item.requestId)}>
          Ders + koçluğu kabul et
        </Button>
        <Button size="lg" variant="outline" disabled={actions.busy} onClick={() => setRejecting(true)}>
          Reddet
        </Button>
      </div>
      <p className="text-small text-ink-mid">
        Kabul etmek ödeme değil, onaydır. Paketin tamamına yanıt verirsin.
      </p>
      <CoachingConfirmDialog
        open={rejecting}
        title="Talebi reddet"
        description="Öğrenciye bildirilir. Bu kararı sonra değiştiremezsin."
        confirmLabel="Reddet"
        isPending={actions.busy}
        onCancel={() => {
          setRejecting(false);
          setNote("");
        }}
        onConfirm={() => {
          actions.onRejectAcceptance(item.requestId, note.trim());
          setRejecting(false);
          setNote("");
        }}
      >
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Neden reddediyorsun? (isteğe bağlı)"
          aria-label="Reddetme notu"
        />
      </CoachingConfirmDialog>
    </>
  );
}

function TimeBody({ item, actions }: { item: TimeInboxItem; actions: CoachingInboxActions }) {
  const ids = useId();
  const [day, setDay] = useState("0");
  const [time, setTime] = useState("18:00");
  return (
    <>
      {item.note ? (
        <p className="rounded-input border border-line bg-paper px-4 py-3 text-body italic text-ink">
          &ldquo;{item.note}&rdquo;
        </p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`${ids}-day`} className="block text-label text-ink-mid">
            Gün
          </label>
          <select
            id={`${ids}-day`}
            value={day}
            onChange={(event) => setDay(event.target.value)}
            className="mt-1 min-h-11 rounded-input border border-line bg-surface px-3 text-body text-ink"
          >
            {Object.entries(COACHING_DAY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${ids}-time`} className="block text-label text-ink-mid">
            Saat
          </label>
          <input
            id={`${ids}-time`}
            type="time"
            step={1800}
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="mt-1 min-h-11 rounded-input border border-line bg-surface px-3 text-body text-ink"
          />
        </div>
        <Button
          size="lg"
          disabled={actions.busy || time === ""}
          onClick={() => actions.onPropose(item.requestId, Number(day), time)}
        >
          Öner
        </Button>
      </div>
      <p className="text-small text-ink-mid">
        Bu saat yayınladığın koçluk müsaitliğinin dışında olabilir; yine de dersle veya başka bir koçluk
        görüşmesiyle çakışmamalı.
      </p>
    </>
  );
}

function RescheduleBody({
  item,
  actions,
}: {
  item: RescheduleInboxItem;
  actions: CoachingInboxActions;
}) {
  const [rejecting, setRejecting] = useState(false);
  return (
    <>
      <dl className="divide-y divide-line rounded-input border border-line bg-paper text-small">
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-4 py-3">
          <dt className="text-ink-mid">Şimdiki saat</dt>
          <dd className="font-bold text-ink">{item.current}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-4 py-3">
          <dt className="text-ink-mid">İstenen saat</dt>
          <dd className="font-bold text-ink">{item.wanted}</dd>
        </div>
      </dl>
      <p className="text-small text-ink-mid">
        {item.usesFreeChange
          ? "Onaylarsan öğrencinin ücretsiz değişiklik hakkından 1 düşer."
          : "Bu değişiklik öğrencinin ücretsiz hakkından düşmez."}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" disabled={actions.busy} onClick={() => actions.onApprove(item.requestId, false)}>
          Onayla
        </Button>
        {item.usesFreeChange ? (
          <Button
            size="lg"
            variant="outline"
            disabled={actions.busy}
            onClick={() => actions.onApprove(item.requestId, true)}
          >
            Acil durum olarak onayla
          </Button>
        ) : null}
        <Button size="lg" variant="outline" disabled={actions.busy} onClick={() => setRejecting(true)}>
          Reddet
        </Button>
      </div>
      <CoachingConfirmDialog
        open={rejecting}
        title="Saat değişikliği reddedilsin mi?"
        description="Görüşme mevcut saatinde kalır ve öğrenciye bildirilir. Bu kararı sonra değiştiremezsin."
        confirmLabel="Reddet"
        isPending={actions.busy}
        onCancel={() => setRejecting(false)}
        onConfirm={() => {
          actions.onRejectReschedule(item.requestId);
          setRejecting(false);
        }}
      />
    </>
  );
}

/**
 * The Talepler page: one inbox for coaching requests, time requests and time
 * changes. The request being answered stands on a pink card with its details and
 * its decision right there (accepting is a solid pink button, rejecting the plain
 * black outline); the rest wait on a gold band, each with a pink button that
 * brings it up into the card; what has been answered sits last on ink.
 *
 * Plain class strings throughout: tailwind-merge would drop a named size such
 * as `text-label` next to a text colour.
 */
export function CoachingInboxBoard({
  pending,
  answered,
  state,
  onRetry,
  isRetrying = false,
  actions,
}: {
  pending: readonly CoachingInboxItem[];
  answered: readonly AnsweredRow[];
  state: "loading" | "error" | "ready";
  onRetry?: () => void;
  isRetrying?: boolean;
  actions: CoachingInboxActions;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const heroRef = useRef<HTMLElement>(null);

  if (state === "loading") {
    return (
      <div role="status" aria-label="Talepler yükleniyor" className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="space-y-3 rounded-card border border-line bg-surface p-5">
        <InlineError message="Talepler yüklenemedi." />
        {onRetry ? (
          <Button type="button" variant="gold" size="sm" onClick={onRetry} disabled={isRetrying}>
            Tekrar dene
          </Button>
        ) : null}
      </div>
    );
  }

  const chosen = pending.find((item) => item.id === selectedId);
  const hero = chosen ?? pending[0];
  const others = pending.filter((item) => item !== hero);
  const isMostUrgent = hero !== undefined && hero === pending[0];

  return (
    <div className="space-y-5">
      {actions.error ? <ErrorMessage message={actions.error} /> : null}

      {hero ? (
        <section
          ref={heroRef}
          aria-label="Sıradaki talep"
          className="overflow-hidden rounded-card border border-pink bg-surface"
        >
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2 bg-pink px-6 py-5 text-primary-foreground">
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-small">{`${isMostUrgent ? "En acil talep" : "Seçtiğin talep"} · ${KIND_LABEL[hero.kind]}`}</p>
              <h2 className="mt-1 text-h2-m font-bold md:text-h2 md:font-bold">{hero.title}</h2>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="text-small">Son yanıt</p>
              <p className="text-body font-bold">{hero.due.value}</p>
            </div>
          </div>
          <div key={hero.id} className="space-y-4 px-6 py-5">
            {hero.kind === "acceptance" ? <AcceptanceBody item={hero} actions={actions} /> : null}
            {hero.kind === "time" ? <TimeBody item={hero} actions={actions} /> : null}
            {hero.kind === "reschedule" ? <RescheduleBody item={hero} actions={actions} /> : null}
          </div>
        </section>
      ) : (
        <p className="rounded-card border border-line bg-surface px-6 py-8 text-center text-body font-medium text-ink">
          Şu an yanıt bekleyen talep yok.
        </p>
      )}

      {others.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("gold", "flex-wrap")}>
            <SectionBandHeading id="coaching-inbox-others-title" title="Diğer talepler" />
            <SectionBandCount tone="gold">{others.length}</SectionBandCount>
          </div>
          <ul>
            {others.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:px-6"
              >
                <RowIcon icon={KIND_ICON[item.kind]} />
                <div className="min-w-0">
                  <p className="text-body font-medium text-ink">{item.title}</p>
                  <p className="text-small text-ink-mid">{item.detail}</p>
                </div>
                <div className="col-start-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:contents">
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-label text-ink-mid">Son yanıt</p>
                    <p className={`text-small font-medium ${item.due.urgent ? "text-pink-deep" : "text-ink"}`}>
                      {item.due.value}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="min-h-11"
                    onClick={() => {
                      setSelectedId(item.id);
                      heroRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {item.kind === "time" ? "Saat öner" : "Yanıtla"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {answered.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("ink", "flex-wrap")}>
            <SectionBandHeading id="coaching-inbox-answered-title" title="Yanıtladıkların" />
            <SectionBandCount tone="ink">{answered.length}</SectionBandCount>
          </div>
          <ul>
            {answered.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0 sm:px-6"
              >
                <RowIcon icon={OUTCOME_ICON[row.outcome]} />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-ink">{row.title}</p>
                  <p className="text-small text-ink-mid">{row.detail}</p>
                </div>
                <p className="shrink-0 text-small text-ink-mid">{row.when}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
