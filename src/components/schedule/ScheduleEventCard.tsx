"use client";

import Link from "next/link";
import { Check, Lock, Pencil, Trash2, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { endTimeLabel } from "./scheduleDates";
import { isPersonal, lessonStatusLabel, toneForEvent } from "./scheduleTheme";

interface ScheduleEventCardProps {
  event: ScheduleEvent;
  onToggleCompleted?: (event: ScheduleEvent, completed: boolean) => void;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (event: ScheduleEvent) => void;
  /** "full" for the daily view, "compact" for a weekly column cell. */
  density?: "full" | "compact";
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
        "flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-medium transition-colors",
        "hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        disabled && "opacity-60"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border-2 border-white/70",
          checked && "bg-white"
        )}
      >
        {checked && <Check className="h-3 w-3 text-slate-900" strokeWidth={3} />}
      </span>
      {withLabel && <span>Tamamlandı</span>}
    </button>
  );
}

/**
 * One event on the calendar. Personal study blocks get a checkbox plus edit and
 * delete; lessons and coaching are read-only and say so with a lock, because a
 * student must never mistake a booked lesson for something they added.
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
  const personal = isPersonal(event);
  const compact = density === "compact";
  // A week column is ~120px wide; a full "18:00 - 19:30 · Onaylandı" line just
  // truncates there, so the compact card keeps the start time only.
  const timeRange = compact
    ? event.local_time
    : `${event.local_time} - ${endTimeLabel(event.local_time, event.duration_minutes)}`;

  return (
    <div
      style={style}
      className={cn(
        "flex min-w-0 gap-2 overflow-hidden rounded-xl border px-3 py-2 shadow-sm",
        tone.card,
        pending && "opacity-60",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[10px] font-semibold uppercase tracking-wide", tone.label)}>
          {personal ? tone.kindLabel : (
            <span className="inline-flex items-center gap-1">
              <Lock className="h-2.5 w-2.5" aria-hidden />
              {tone.kindLabel}
              {/* The lock is decorative, so the read-only fact has to be said
                  in text or a screen reader never learns it. */}
              <span className="sr-only">, salt okunur</span>
            </span>
          )}
        </p>
        <p
          // Truncated everywhere the card is narrow; the native tooltip is the
          // only way to read a long note without opening the edit dialog.
          title={event.title}
          className={cn(
            "font-semibold",
            wrapText ? "break-words" : "truncate",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {event.title}
        </p>
        <p className={cn("truncate tabular-nums", compact ? "text-[10px]" : "text-xs")}>
          {timeRange}
          {!personal && !compact && ` · ${lessonStatusLabel(event.status)}`}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-1">
        {personal && onToggleCompleted && (
          <CompletionCheckbox
            checked={Boolean(event.completed)}
            disabled={pending}
            withLabel={!compact}
            onChange={(next) => onToggleCompleted(event, next)}
          />
        )}

        {!personal && event.room_url && event.source === "booking" && (
          <Link
            href={`/session/${event.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-600"
          >
            <Video className="h-3 w-3" aria-hidden />
            Derse git
          </Link>
        )}
        {!personal && event.room_url && event.source === "coaching" && (
          <Link
            href={`/session/coaching/${event.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-600"
          >
            <Video className="h-3 w-3" aria-hidden />
            Görüşmeye git
          </Link>
        )}

        {personal && (onEdit || onDelete) && (
          <div className="flex items-center gap-0.5">
            {onEdit && (
              <button
                type="button"
                aria-label="Çalışmayı düzenle"
                onClick={() => onEdit(event)}
                className="rounded-md p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                aria-label="Çalışmayı sil"
                onClick={() => onDelete(event)}
                className="rounded-md p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
