"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

import { InlineError } from "@/components/shared/InlineError";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import { coachingLocalDateHeading } from "@/lib/coachingTime";
import {
  buildRecordsMonth,
  type RecordItem,
  type RecordKind,
  type buildCoachingRecords,
} from "@/lib/coachingRecords";

export interface RecordDispute {
  id: string;
  title: string;
  status: string;
  href: string;
}

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const KIND_NOUN: Record<RecordKind, string> = { owed: "yazılacak", draft: "taslak", published: "yayınlanan" };
const DOT_CLASS: Record<RecordKind, string> = { owed: "bg-pink", draft: "bg-gold", published: "bg-ink" };

/** Writing or carrying on a report is the action: solid pink, white text. Viewing one is solid gold. */
function ActionLink({ item }: { item: RecordItem }) {
  return (
    <Button
      asChild
      size="sm"
      variant={item.kind === "published" ? "gold" : "default"}
      className="min-h-11"
    >
      <Link href={item.action.href}>{item.action.label}</Link>
    </Button>
  );
}

function Row({
  item,
  aside,
}: {
  item: RecordItem;
  aside?: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-6">
      <div className="min-w-0">
        <p className="text-body font-medium text-ink">{item.studentName ?? "Öğrenci bilgisi yok"}</p>
        <p className="text-small text-ink-mid">{item.detail}</p>
      </div>
      {aside ?? <span className="hidden sm:block" />}
      <div>
        <ActionLink item={item} />
      </div>
    </li>
  );
}

/**
 * The Kayıtlar page. Reports owed come first on a pink band, each with its
 * deadline set large, because the deadline is what the tutor acts on; they sit
 * above the calendar so one in an earlier month cannot be missed. The calendar
 * below shows the month's reports by day (a pink dot for one owed, gold for a
 * draft, ink for a published one) and the pressed day's reports under it.
 * Complaints come last on ink.
 *
 * Plain class strings throughout: tailwind-merge would drop a named size such
 * as `text-label` next to a text colour.
 */
export function CoachingRecordsBoard({
  records,
  today,
  disputes,
  disputesState,
  onRetryDisputes,
}: {
  records: ReturnType<typeof buildCoachingRecords>;
  /** Today in Istanbul, "2026-10-19". */
  today: string;
  disputes: readonly RecordDispute[];
  disputesState: "loading" | "error" | "ready";
  onRetryDisputes?: () => void;
}) {
  const [view, setView] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  }));
  const [selected, setSelected] = useState(() => records.owed[0]?.dateKey ?? today);

  const month = buildRecordsMonth({ ...view, items: records.items, today });
  const monthName = month.title.split(" ")[0];
  const dayItems = records.byDay[selected] ?? [];

  return (
    <div className="space-y-5">
      {records.owed.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("pink", "flex-wrap")}>
            <SectionBandHeading id="coaching-records-owed-title" title="Yazılacak raporlar" />
            <SectionBandCount tone="pink">{records.owed.length}</SectionBandCount>
          </div>
          <ul>
            {records.owed.map((item) => (
              <Row
                key={item.id}
                item={item}
                aside={
                  item.due ? (
                    <div className="sm:text-right">
                      <p className="text-label text-ink-mid">Son tarih</p>
                      <p
                        className={`text-h3-m font-bold md:text-h3 md:font-bold ${
                          item.due.urgent ? "text-pink-deep" : "text-ink"
                        }`}
                      >
                        {item.due.value}
                      </p>
                    </div>
                  ) : undefined
                }
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className={sectionBandClass("ink", "flex-wrap")}>
          <SectionBandHeading id="coaching-records-month-title" title={month.title} />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="gold"
              aria-label="Önceki ay"
              onClick={() => setView(month.prev)}
            >
              <CaretLeft aria-hidden="true" className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="gold"
              aria-label="Sonraki ay"
              onClick={() => setView(month.next)}
            >
              <CaretRight aria-hidden="true" className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-line px-4 py-3 text-label text-ink-mid sm:px-6">
          {(["owed", "draft", "published"] as const).map((kind) => (
            <span key={kind} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-2 w-2 rounded-pill ${DOT_CLASS[kind]}`} />
              {KIND_NOUN[kind]}
            </span>
          ))}
        </div>

        <div className="px-2 pb-3 pt-2 sm:px-4">
          <div className="grid grid-cols-7 text-center text-label text-ink-mid">
            {WEEKDAYS.map((name) => (
              <span key={name} className="py-1">
                {name}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {month.cells.map((cell, index) => {
              if (!cell) return <span key={`blank-${index}`} aria-hidden="true" />;
              const kinds = (["owed", "draft", "published"] as const).filter((kind) => cell.counts[kind] > 0);
              const summary = kinds.map((kind) => `${cell.counts[kind]} ${KIND_NOUN[kind]}`).join(", ");
              const isSelected = cell.dateKey === selected;
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  aria-label={`${cell.day} ${monthName}${summary ? `, ${summary}` : ""}`}
                  aria-pressed={isSelected}
                  aria-current={cell.isToday ? "date" : undefined}
                  onClick={() => setSelected(cell.dateKey)}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-input text-small transition-colors duration-[var(--duration-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
                    isSelected ? "bg-ink text-paper" : "text-ink hover:bg-paper"
                  } ${cell.isToday ? "font-bold underline underline-offset-4" : ""}`}
                >
                  {cell.day}
                  <span aria-hidden="true" className="flex h-2 gap-0.5">
                    {kinds.map((kind) => (
                      <span
                        key={kind}
                        className={`h-2 w-2 rounded-pill ring-1 ${DOT_CLASS[kind]} ${
                          isSelected ? "ring-paper" : "ring-surface"
                        }`}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <section aria-label={coachingLocalDateHeading(selected)} className="border-t border-line bg-paper">
          <h3 className="px-4 pt-3 text-label font-medium text-ink-mid sm:px-6">
            {coachingLocalDateHeading(selected)}
          </h3>
          {dayItems.length === 0 ? (
            <p className="px-4 py-4 text-small text-ink-mid sm:px-6">Bu gün için rapor yok.</p>
          ) : (
            <ul>
              {dayItems.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  aside={
                    item.due ? (
                      <div className="sm:text-right">
                        <p className="text-label text-ink-mid">Son tarih</p>
                        <p className={`text-small font-medium ${item.due.urgent ? "text-pink-deep" : "text-ink"}`}>
                          {item.due.value}
                        </p>
                      </div>
                    ) : undefined
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {records.undated.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("ink", "flex-wrap")}>
            <SectionBandHeading id="coaching-records-undated-title" title="Tarihi görünmeyen raporlar" />
            <SectionBandCount tone="ink">{records.undated.length}</SectionBandCount>
          </div>
          <ul>
            {records.undated.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ul>
        </div>
      ) : null}

      {disputesState === "error" ? (
        <div className="space-y-3 rounded-card border border-line bg-surface p-5">
          <InlineError message="Sorun bildirimleri yüklenemedi." />
          {onRetryDisputes ? (
            <Button type="button" variant="gold" size="sm" onClick={onRetryDisputes}>
              Tekrar dene
            </Button>
          ) : null}
        </div>
      ) : null}

      {disputesState === "ready" && disputes.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className={sectionBandClass("ink", "flex-wrap")}>
            <SectionBandHeading id="coaching-records-disputes-title" title="Sorun bildirimleri" />
            <SectionBandCount tone="ink">{disputes.length}</SectionBandCount>
          </div>
          <ul>
            {disputes.map((dispute) => (
              <li
                key={dispute.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 sm:px-6"
              >
                <div className="min-w-0 flex-1 basis-48">
                  <p className="text-body font-medium text-ink">{dispute.title}</p>
                  <p className="text-small text-ink-mid">
                    Öğrenci açıklaması ve iç inceleme notları burada paylaşılmaz.
                  </p>
                </div>
                <p className="shrink-0 text-small font-medium text-ink">{dispute.status}</p>
                <Button asChild size="sm" variant="gold" className="min-h-11">
                  <Link href={dispute.href}>Aç</Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
