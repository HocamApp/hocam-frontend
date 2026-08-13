import axios from "axios";

import api from "./api";
import type {
  ScheduleCalendarResponse,
  ScheduleProgressResponse,
  StudyBlock,
  StudyBlockPayload,
} from "@/types";

/**
 * Calendar for a date range. `from`/`to` are Istanbul local dates (YYYY-MM-DD)
 * and the backend caps the span at 62 days — which view is selected is a
 * frontend concern, the API only knows about ranges.
 */
export async function fetchScheduleCalendar(
  from: string,
  to: string
): Promise<ScheduleCalendarResponse> {
  const response = await api.get<ScheduleCalendarResponse>("/schedule/calendar/", {
    params: { from, to },
  });
  return response.data;
}

/**
 * `week` is any day inside the wanted ISO week. It scopes `weekly_completion`
 * only — `subject_stats` is all-time by design.
 */
export async function fetchScheduleProgress(
  week: string
): Promise<ScheduleProgressResponse> {
  const response = await api.get<ScheduleProgressResponse>("/schedule/progress/", {
    params: { week },
  });
  return response.data;
}

export async function createStudyBlock(
  payload: StudyBlockPayload
): Promise<StudyBlock> {
  const response = await api.post<StudyBlock>("/schedule/blocks/", payload);
  return response.data;
}

/**
 * Editing a running weekly series never mutates it: the backend closes the old
 * series at `effectiveDate - 1` and opens a replacement, so occurrences the
 * student already ticked keep pointing at the plan that was in force. Single
 * blocks are updated in place and ignore `effectiveDate`.
 */
export async function updateStudyBlock(
  blockId: string,
  payload: Partial<StudyBlockPayload>,
  effectiveDate?: string
): Promise<StudyBlock> {
  const response = await api.patch<StudyBlock>(
    `/schedule/blocks/${blockId}/`,
    payload,
    { params: effectiveDate ? { effective_date: effectiveDate } : undefined }
  );
  return response.data;
}

/** Delete a single block. Only valid when `recurrence === "none"`. */
export async function deleteStudyBlock(blockId: string): Promise<void> {
  await api.delete(`/schedule/blocks/${blockId}/`);
}

/** Drop one week of a series; the series itself keeps running. */
export async function skipStudyBlockOccurrence(
  blockId: string,
  occurrenceDate: string
): Promise<void> {
  await api.delete(`/schedule/blocks/${blockId}/`, {
    params: { scope: "this_occurrence", occurrence_date: occurrenceDate },
  });
}

/** End a series from `effectiveDate` on, keeping everything before it. */
export async function endStudyBlockSeries(
  blockId: string,
  effectiveDate: string
): Promise<void> {
  await api.delete(`/schedule/blocks/${blockId}/`, {
    params: { scope: "series", effective_date: effectiveDate },
  });
}

/**
 * The checkbox. Un-ticking removes the occurrence row entirely (back to
 * "planned, unmarked"); an occurrence dropped with "sadece bu hafta" answers
 * 409 here rather than silently coming back.
 */
export async function setOccurrenceCompleted(
  blockId: string,
  occurrenceDate: string,
  completed: boolean
): Promise<void> {
  await api.patch(
    `/schedule/occurrences/${blockId}/${occurrenceDate}/complete/`,
    { completed }
  );
}

/**
 * Turns a DRF error body into something a student can act on. The backend
 * answers field errors as `{field: ["..."]}` and refusals as `{detail: "..."}`;
 * a 409 has one specific meaning here, so it gets its own sentence.
 */
export function getScheduleErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;

  if (error.response?.status === 409) {
    return "Bu hafta atlanmış bir çalışma tamamlandı olarak işaretlenemez.";
  }

  const data = error.response?.data;
  if (!data || typeof data !== "object") return fallback;

  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;

  const firstFieldError = Object.values(data as Record<string, unknown>)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .find((value) => typeof value === "string" && value.trim());

  return typeof firstFieldError === "string" ? firstFieldError : fallback;
}
