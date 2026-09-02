"use client";

import { Check, Lock, PencilSimple, Trash } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { endTimeLabel } from "./scheduleDates";
import { shortEventLabel } from "./eventLabels";
import { isPersonal, lessonStatusLabel, toneForEvent } from "./scheduleTheme";

/**
 * How much room the card has, which decides what it can afford to say.
 *
 * "compact" — a week cell, ~110px wide. Smaller type, no action column.
 * "full"    — a day row, the mobile day list and the detail dialog.
 */
type ScheduleEventDensity = "compact" | "full";

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
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  withLabel: boolean;
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
        "hover:bg-white/15 focus-visible:ring-white/70",
        disabled && "opacity-60"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border-2 border-white/70",
          checked && "bg-white"
        )}
      >
        {checked && (
          <Check className="h-3 w-3 text-slate-900" strokeWidth={3} />
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

  // The full range on its own line, at every density. It used to share a line
  // with the title, where a week column had room for the start time only.
  const timeRange = `${event.local_time} - ${endTimeLabel(event.local_time, event.duration_minutes)}`;
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

  return (
    <div
      style={style}
      className={cn(
        // The reference calendar this is drawn from lifts a block on hover:
        // it grows slightly, gains a shadow and rises above its neighbours.
        // Reduced motion keeps the shadow and drops the scale.
        "group relative flex min-w-0 transform-gpu border border-transparent",
        "transition-[transform,box-shadow,opacity] duration-[--duration-state]",
        "hover:z-20 hover:scale-[1.02] hover:shadow-lg focus-within:z-20",
        "motion-reduce:transition-none motion-reduce:hover:scale-100",
        // 10px, the input step. A pill or a 20px card corner on a block that
        // has to sit flush between two hour rules reads as a floating tag
        // rather than a slot in a calendar.
        "rounded-input",
        // A phone's day column is ~300px wide; the desktop card's padding is
        // most of what makes a 40-minute block look like a poster there.
        compact ? "gap-1.5 px-2 py-1" : "gap-2 px-3 py-2 max-md:gap-1.5 max-md:px-2 max-md:py-1",
        tone.card,
        pending && "opacity-60",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {/* Name first, time under it. The time is already named by the row the
            block sits in, so leading with it spent the widest line in the card
            on the one fact the grid was carrying anyway. */}
        <p
          title={event.title}
          className={cn(
            "font-semibold",
            compact ? "truncate text-xs" : "text-sm",
            !compact && (wrapText ? "break-words" : "truncate")
          )}
        >
          {displayTitle}
        </p>

        <p
          className={cn(
            "truncate tabular-nums opacity-90",
            compact ? "text-[10px]" : "text-xs"
          )}
        >
          {timeRange}
          {statusLabel && !compact && ` · ${statusLabel}`}
        </p>

        <p
          className={cn(
            "mt-0.5 flex min-w-0 items-center gap-1 truncate font-semibold",
            compact ? "text-[10px] tracking-tight" : "text-[10px] uppercase tracking-wide",
            tone.label
          )}
        >
          <KindIcon className="h-2.5 w-2.5 shrink-0" aria-hidden />
          {/* In a week cell the words do not fit at rest; the icon and the
              lock stay at every width, so the read-only signal never drops,
              and hovering spells it out. */}
          <span className={cn("truncate", compact && "hidden group-hover:inline")}>
            {tone.kindLabel}
          </span>
          {!personal && (
            <>
              <Lock className="h-2.5 w-2.5 shrink-0" aria-hidden />
              {/* The lock is decorative, so the read-only fact has to be said
                  in text or a screen reader never learns it. */}
              <span className="sr-only">, salt okunur</span>
            </>
          )}
        </p>

        {/* A week cell is too narrow for the status at rest. */}
        {compact && statusLabel && (
          <p aria-hidden className="hidden truncate text-[10px] opacity-90 group-hover:block">
            {statusLabel}
          </p>
        )}

        {/* In a week cell the checkbox rides under the label rather than
            taking a column of its own, so the title gets the full width. */}
        {compact && personal && onToggleCompleted && (
          <CompletionCheckbox
            checked={Boolean(event.completed)}
            disabled={pending}
            withLabel={false}
            onChange={(next) => onToggleCompleted(event, next)}
          />
        )}
      </div>

      {hasActions && (
        <div className="flex shrink-0 flex-col items-end justify-between gap-1">
          {onToggleCompleted && (
            <CompletionCheckbox
              checked={Boolean(event.completed)}
              disabled={pending}
              withLabel
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
                  className="rounded-input p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
                </button>
              )}
              {showDelete && onDelete && (
                <button
                  type="button"
                  aria-label="Çalışmayı sil"
                  onClick={() => onDelete(event)}
                  className="rounded-input p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
