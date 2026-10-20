"use client";

import { COACHING_DAY_LABEL } from "@/lib/coachingApi";
import {
  groupSlotsByDay,
  type LockedScheduleSlots,
  type PickedScheduleSlot,
  type ScheduleHour,
} from "@/lib/coachingStudentSchedule";

const CHIP_BASE =
  "min-h-11 min-w-[4.5rem] rounded-input border px-3 text-body font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";
const CHIP_ON = "border-ink bg-gold text-gold-ink";
const CHIP_OFF = "border-line bg-surface text-ink hover:border-ink";
const CHIP_FULL = "cursor-not-allowed border-line bg-surface text-ink-mid";

/**
 * The tutor's open hours, one group per day, as tappable hours. Choosing is
 * the page's business (it owns the selection); this only draws the hours and
 * reports a tap. An hour the tutor proposed and the student accepted is shown
 * as fixed and cannot be picked over.
 */
export function StudentSchedulePicker({
  slots,
  locked,
  selected,
  canPickMore,
  onToggle,
}: {
  slots: readonly ScheduleHour[];
  locked: LockedScheduleSlots;
  selected: readonly PickedScheduleSlot[];
  /** False once every open slot has an hour: the rest can only be taken back. */
  canPickMore: boolean;
  onToggle: (day: number, time: string) => void;
}) {
  const days = groupSlotsByDay(slots);
  const lockedHours = Object.entries(locked).sort(([a], [b]) => Number(a) - Number(b));
  const isChosen = (day: number, time: string) =>
    selected.some((slot) => slot.day_of_week === day && slot.start_time === time);

  return (
    <section aria-label="Hocanın açık saatleri" className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-body font-medium text-ink">Hocanın açık saatleri</h2>
      <p className="mt-1 text-small text-ink-mid">Saatler Türkiye saatidir. Her görüşme 30 dakikadır.</p>

      {lockedHours.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {lockedHours.map(([index, hour]) => (
            <li
              key={index}
              className="flex min-h-11 flex-wrap items-center gap-x-3 rounded-input bg-ink px-4 py-2 text-paper"
            >
              <span className="text-body font-medium tabular-nums">
                {`${COACHING_DAY_LABEL[hour.day_of_week] ?? ""} ${hour.start_time.slice(0, 5)}`}
              </span>
              <span className="text-small">Hocanın önerdiği saat</span>
            </li>
          ))}
        </ul>
      ) : null}

      {days.length === 0 ? (
        <p className="mt-4 rounded-input border border-line p-4 text-body text-ink-mid">
          Hocanın açık saatleri şu an boş ya da başka görüşmelerle çakışıyor. Aşağıdan hocandan saat isteyebilirsin.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {days.map((group) => (
            <fieldset key={group.day} className="space-y-2">
              <legend className="text-small font-medium text-ink-mid">{group.label}</legend>
              <div className="flex flex-wrap gap-2">
                {group.times.map((time) => {
                  const chosen = isChosen(group.day, time.value);
                  const full = !chosen && !canPickMore;
                  return (
                    <button
                      key={time.value}
                      type="button"
                      aria-pressed={chosen}
                      aria-label={`${group.label} ${time.label}`}
                      disabled={full}
                      onClick={() => onToggle(group.day, time.value)}
                      className={`${CHIP_BASE} ${chosen ? CHIP_ON : full ? CHIP_FULL : CHIP_OFF}`}
                    >
                      {time.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </section>
  );
}
