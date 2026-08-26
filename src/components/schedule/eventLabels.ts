import type { ScheduleEvent } from "@/types";

/**
 * The label that fits a week column or a month cell.
 *
 * The server composes event.title for full-width surfaces — "Matematik · Memin
 * Sönmez" for a lesson, "Matematik · Soru Çözümü" for a block. In a ~100px
 * chip that title spends its entire width on the first word and truncates
 * before it says anything, which is how the weekly grid ended up rendering
 * "F.." for every Felsefe lesson.
 *
 * The subject alone identifies the lesson; the tutor's name is not something a
 * student scans a calendar for, and it is still one click away in the detail
 * dialog, which shows the composed title in full.
 */
export function shortEventLabel(event: ScheduleEvent): string {
  if (event.source === "coaching") return "Koçluk";
  if (event.source === "study_block") {
    return event.block_title?.trim() || event.subject?.name || event.title;
  }
  return event.subject?.name || event.title;
}
