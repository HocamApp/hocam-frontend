"use client";

import { Check, Lock, PencilSimple, Trash } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { endTimeLabel, formatMinutes } from "./scheduleDates";
import { shortEventLabel } from "./eventLabels";
import { dayHueForEvent, isPersonal, lessonStatusLabel, toneForEvent } from "./scheduleTheme";

/**
 * How much room the card has, which decides what it can afford to say.
 *
 * "compact" — a week column or a split day cluster, ~100px. Two lines.
 * "full"    — the detail dialog and the mobile day list. Three lines.
 * "expanded" — a full-width day row. Three lines plus a right-hand meta column.
 */
type ScheduleEventDensity = "compact" | "full" | "expanded";

interface ScheduleEventCardProps {
  event: ScheduleEvent;
  onToggleCompleted?: (event: ScheduleEvent, completed: boolean) => void;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (event: ScheduleEvent) => void;
  density?: ScheduleEventDensity;
  /** Let the title wrap instead of truncating — for the detail dialog, which
   * is the one place with room to show a long note in full. */
  wrapText?: boolean;
  pending?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function CompletionCheckbox({
  checked,
  onChange,
  disabled,
  withLabel,
  onLight,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  withLabel: boolean;
  /** Pale day-view body: white-on-dark styling would be invisible there. */
  onLight?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? "Tamamlandı işaretini kaldır" : "Tamamlandı olarak işaretle"}
      disabled={disabled}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-input px-1.5 py-1 text-[11px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2",
        onLight
          ? "hover:bg-black/5 focus-visible:ring-ring dark:hover:bg-white/10"
          : "hover:bg-white/15 focus-visible:ring-white/70",
        disabled && "opacity-60"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border-2",
          onLight ? "border-current opacity-90" : "border-white/70",
          checked && (onLight ? "bg-current" : "bg-white")
        )}
      >
        {checked && (
          <Check
            className={cn("h-3 w-3", onLight ? "text-background" : "text-slate-900")}
            strokeWidth={3}
          />
        )}
      </span>
      {withLabel && <span>Tamamlandı</span>}
    </button>
  );
}

/**
 * One event on the calendar. Personal study blocks get a checkbox plus edit and
 * delete; lessons and coaching are read-only and say so with a lock, because a
 * student must never mistake a booked lesson for something they added.
 *
 * The card carries no "join lesson" affordance. The schedule is where a student
 * reads their week; joining lives on the panel, next to the rest of the
 * pre-lesson context. A join button here cost ~84px of un-shrinkable width in a
 * ~100px week column, which is what starved the title down to one character.
 */
export function ScheduleEventCard({
  event,
  onToggleCompleted,
  onEdit,
  onDelete,
  density = "full",
  wrapText = false,
  pending,
  className,
  style,
}: ScheduleEventCardProps) {
  const tone = toneForEvent(event);
  const KindIcon = tone.icon;
  const personal = isPersonal(event);
  const compact = density === "compact";
  const expanded = density === "expanded";

  // A week column is ~100px wide; a full "18:00 - 19:30 · Onaylandı" line just
  // truncates there, so the compact card keeps the start time only.
  const timeRange = compact
    ? event.local_time
    : `${event.local_time} - ${endTimeLabel(event.local_time, event.duration_minutes)}`;
  const displayTitle = compact ? shortEventLabel(event) : event.title;

  // Only personal blocks have controls. A read-only lesson renders no action
  // column at all, so nothing reserves width the text could have used.
  //
  // In a week cell even the personal controls are too much: the checkbox plus
  // edit and delete reserve ~48px of a ~130px card and truncate the title back
  // down to "20:00 N...". Ticking is the one thing worth doing from the grid;
  // editing and deleting stay in the day view and the detail dialog.
  const showEdit = Boolean(onEdit) && !compact;
  const showDelete = Boolean(onDelete) && !compact;
  // At compact density the checkbox moves inline (see below), so the whole
  // right-hand column disappears and reserves nothing.
  const hasActions = !compact && personal && Boolean(onToggleCompleted || showEdit || showDelete);
  const statusLabel = personal ? null : lessonStatusLabel(event.status);

  // The day view paints a pale body and puts the saturated colour in a fixed
  // 4px bar, so a two-hour block carries no more loud pixels than a 30-minute
  // one. Everywhere else the chip height is constant and the tone can fill it.
  const dayHue = expanded ? dayHueForEvent(event) : null;

  return (
    <div
      style={style}
      className={cn(
        "relative flex min-w-0 overflow-hidden border",
        compact
          ? "gap-1.5 rounded-card px-2 py-1.5"
          : "gap-2 rounded-card py-2",
        expanded ? "pl-4 pr-3" : !compact && "px-3",
        dayHue ? dayHue.dayCard : tone.card,
        pending && "opacity-60",
        className
      )}
    >
      {dayHue && (
        <span
          className={cn("absolute inset-y-0 left-0 w-1", dayHue.dot)}
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1">
        {expanded ? (
          // One line across the full width of a day row: time, then the full
          // composed title, then the category pushed out to the right.
          <p className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 text-sm font-semibold tabular-nums">{timeRange}</span>
            <span title={event.title} className="min-w-0 flex-1 truncate text-sm font-semibold">
              {displayTitle}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide",
                dayHue ? dayHue.label : tone.label
              )}
            >
              <KindIcon className="h-2.5 w-2.5" aria-hidden />
              {/* The words go first when there is room; the icon and the lock
                  stay at every width, so the read-only signal never drops. */}
              <span className="hidden sm:inline">{tone.kindLabel}</span>
              {!personal && (
                <>
                  <Lock className="h-2.5 w-2.5" aria-hidden />
                  <span className="sr-only">, salt okunur</span>
                </>
              )}
            </span>
          </p>
        ) : compact ? (
          // Time first: it is what a student scans a week for, and it is the
          // one field short enough to survive at any column width.
          <p className="flex min-w-0 items-baseline gap-1.5">
            <span className="shrink-0 text-[11px] font-semibold tabular-nums">
              {event.local_time}
            </span>
            <span title={event.title} className="min-w-0 flex-1 truncate text-xs font-semibold">
              {displayTitle}
            </span>
          </p>
        ) : null}

        {/* The expanded row above already carries the category, the icon and
            the lock. Rendering this block as well and hiding it with a class
            left the ", salt okunur" note in the DOM twice, so a screen reader
            announced it twice. */}
        {!expanded && (
        <div className={cn("flex min-w-0 items-center gap-1", compact && "justify-between")}>
          <p
            className={cn(
              "min-w-0 truncate text-[10px] font-semibold",
              // Uppercase plus letter-spacing is what pushed "Hocam Dersi" past
              // the edge of a week cell; the wide treatment stays where there
              // is room for it.
              compact ? "tracking-tight" : "uppercase tracking-wide",
              tone.label
            )}
          >
            <span className="inline-flex items-center gap-1">
              <KindIcon className="h-2.5 w-2.5" aria-hidden />
              {tone.kindLabel}
              {!personal && (
                <>
                  <Lock className="h-2.5 w-2.5" aria-hidden />
                  {/* The lock is decorative, so the read-only fact has to be
                      said in text or a screen reader never learns it. */}
                  <span className="sr-only">, salt okunur</span>
                </>
              )}
            </span>
          </p>

          {/* In a week cell the checkbox rides the kind-label line rather than
              a column of its own, so the title above it gets the full width. */}
          {compact && personal && onToggleCompleted && (
            <CompletionCheckbox
              checked={Boolean(event.completed)}
              disabled={pending}
              withLabel={false}
              onChange={(next) => onToggleCompleted(event, next)}
            />
          )}
        </div>
        )}

        {!compact && !expanded && (
          <>
            <p
              // Truncated everywhere the card is narrow; the native tooltip is
              // the only way to read a long note without opening the dialog.
              title={event.title}
              className={cn("text-sm font-semibold", wrapText ? "break-words" : "truncate")}
            >
              {displayTitle}
            </p>
            <p className="truncate text-xs tabular-nums">
              {timeRange}
              {statusLabel && ` · ${statusLabel}`}
            </p>
          </>
        )}
      </div>

      {expanded && (
        // A full-width day row is ~1000px; without this the whole right half
        // was empty while the text crowded into the left edge.
        <div className="flex shrink-0 flex-col items-end justify-center gap-1 text-right">
          <span className="text-xs font-medium tabular-nums opacity-80">
            {formatMinutes(event.duration_minutes)}
          </span>
          {statusLabel && (
            <span className="rounded-pill border border-current/30 px-2 py-0.5 text-[10px] font-semibold">
              {statusLabel}
            </span>
          )}
        </div>
      )}

      {hasActions && (
        <div className="flex shrink-0 flex-col items-end justify-between gap-1">
          {onToggleCompleted && (
            <CompletionCheckbox
              checked={Boolean(event.completed)}
              disabled={pending}
              withLabel
              onLight={expanded}
              onChange={(next) => onToggleCompleted(event, next)}
            />
          )}

          {(showEdit || showDelete) && (
            <div className="flex items-center gap-0.5">
              {showEdit && onEdit && (
                <button
                  type="button"
                  aria-label="Çalışmayı düzenle"
                  onClick={() => onEdit(event)}
                  className={cn("rounded-input p-1 focus-visible:outline-none focus-visible:ring-2", expanded ? "hover:bg-black/5 focus-visible:ring-ring dark:hover:bg-white/10" : "hover:bg-white/20 focus-visible:ring-white/70")}
                >
                  <PencilSimple className="h-3.5 w-3.5" />
                </button>
              )}
              {showDelete && onDelete && (
                <button
                  type="button"
                  aria-label="Çalışmayı sil"
                  onClick={() => onDelete(event)}
                  className={cn("rounded-input p-1 focus-visible:outline-none focus-visible:ring-2", expanded ? "hover:bg-black/5 focus-visible:ring-ring dark:hover:bg-white/10" : "hover:bg-white/20 focus-visible:ring-white/70")}
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
