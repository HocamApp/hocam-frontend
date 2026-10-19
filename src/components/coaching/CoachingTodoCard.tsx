"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowsClockwise,
  ClockCountdown,
  FileText,
  UserPlus,
  VideoCamera,
  type Icon,
} from "@phosphor-icons/react";

import { InlineError } from "@/components/shared/InlineError";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoachingTodo, CoachingTodoKind, CoachingTodoTab } from "@/lib/coachingOverview";

const KIND_ICONS: Record<CoachingTodoKind, Icon> = {
  acceptance: UserPlus,
  session: VideoCamera,
  report: FileText,
  time: ClockCountdown,
  reschedule: ArrowsClockwise,
};

const TAB_LABELS: Record<CoachingTodoTab, string> = {
  requests: "Talepler",
  reports: "Raporlar",
  today: "Bugün",
};
const TAB_ORDER: readonly CoachingTodoTab[] = ["requests", "reports", "today"];

/**
 * What is waiting for the tutor, soonest first, on a pink band because this is
 * the part that asks for action. Each row ends in a solid gold button: the
 * outline pill the system uses elsewhere is the colour of the row behind it, and
 * on a list of things to do the way in has to be the first thing the eye finds.
 * Gold is the tutor-side action colour (DESIGN.md §8) and sits well on the white
 * rows; the urgent deadline alone is pink-deep.
 *
 * Plain class strings throughout: tailwind-merge would drop a named size such as
 * `text-label` next to a text colour.
 */
export function CoachingTodoCard({
  todos,
  state,
  onRetry,
  isRetrying = false,
}: {
  todos: readonly CoachingTodo[];
  state: "loading" | "error" | "ready";
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  const [chosen, setChosen] = useState<CoachingTodoTab | "all">("all");

  const counts = TAB_ORDER.map((tab) => ({ tab, count: todos.filter((todo) => todo.tab === tab).length }));
  // A kind that has been cleared falls back to everything instead of an empty list.
  const active = chosen !== "all" && counts.find((entry) => entry.tab === chosen)?.count ? chosen : "all";
  const shown = active === "all" ? todos : todos.filter((todo) => todo.tab === active);
  const showChips = todos.length > 1;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className={sectionBandClass("pink", "flex-wrap")}>
        <SectionBandHeading id="coaching-todo-title" title="Yapılacaklar" />
        {state === "ready" && todos.length > 0 ? (
          <SectionBandCount tone="pink">{todos.length}</SectionBandCount>
        ) : null}
      </div>

      {state === "loading" ? (
        <div role="status" aria-label="Yapılacaklar yükleniyor" className="space-y-3 px-4 py-4 sm:px-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {state === "error" ? (
        <div className="space-y-3 px-4 py-5 sm:px-6">
          <InlineError message="Yapılacaklar yüklenemedi." />
          {onRetry ? (
            <Button type="button" variant="gold" size="sm" onClick={onRetry} disabled={isRetrying}>
              Tekrar dene
            </Button>
          ) : null}
        </div>
      ) : null}

      {state === "ready" && todos.length === 0 ? (
        <div className="px-4 py-8 text-center sm:px-6">
          <p className="text-body font-medium text-ink">Şu an yapılacak bir şey yok.</p>
          <p className="mt-1 text-small text-ink-mid">
            Yeni talep, saat isteği ve yazılacak rapor burada görünür.
          </p>
        </div>
      ) : null}

      {state === "ready" && todos.length > 0 ? (
        <>
          {showChips ? (
            <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3 sm:px-6">
              {[{ tab: "all" as const, count: todos.length, label: "Hepsi" }, ...counts
                .filter((entry) => entry.count > 0)
                .map((entry) => ({ ...entry, label: TAB_LABELS[entry.tab] }))].map((chip) => (
                <button
                  key={chip.tab}
                  type="button"
                  aria-pressed={active === chip.tab}
                  onClick={() => setChosen(chip.tab)}
                  className={`inline-flex min-h-11 items-center rounded-pill border px-4 text-small font-medium transition-colors duration-[var(--duration-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
                    active === chip.tab
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-surface text-ink hover:border-ink"
                  }`}
                >
                  {`${chip.label} ${chip.count}`}
                </button>
              ))}
            </div>
          ) : null}

          <ul>
            {shown.map((todo) => {
              const RowIcon = KIND_ICONS[todo.kind];
              return (
                <li
                  key={todo.id}
                  // Below ~400px the button drops under the text, as on the settings rows.
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 border-t border-line px-4 py-3 first:border-t-0 min-[400px]:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-6"
                >
                  <RowIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-mid" />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body font-medium text-ink">
                      <span>{todo.title}</span>
                      {todo.due ? (
                        <span
                          className={`inline-flex rounded-pill px-2 text-label font-medium ${
                            todo.due.urgent ? "bg-pink-deep text-white" : "border border-ink text-ink"
                          }`}
                        >
                          {todo.due.label}
                        </span>
                      ) : null}
                    </p>
                    {todo.detail ? <p className="mt-0.5 text-small text-ink-mid">{todo.detail}</p> : null}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="gold"
                    className="col-start-2 mt-2 min-h-11 justify-self-start min-[400px]:col-start-3 min-[400px]:mt-0 min-[400px]:justify-self-auto"
                  >
                    <Link href={todo.action.href}>{todo.action.label}</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
