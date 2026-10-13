/**
 * Putting the credits of a paid package that are not on the calendar onto the
 * tutor's free hours, in one call (POST /api/payments/package-purchases/{id}/place-lessons/,
 * apps.lessons.package_schedule.place_unscheduled_credits on the backend).
 */
export interface PlaceLessonsRequest {
  subject: string;
  slots: { day_of_week: number; start_time: string }[];
}

export interface PlaceLessonsResult {
  /** Lessons written by this call. 0 when no credit was left, or none fit. */
  placed: number;
  lessons: { id: string; start_time: string }[];
  /** Credits still not on the calendar after this call. */
  remaining_credits: number;
  /** Credits whose lesson would have fallen after the end of the term. */
  skipped_after_term: number;
  /** Lessons the database refused; their credits stay. */
  not_stored: number;
}
