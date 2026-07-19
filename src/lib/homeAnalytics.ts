export type HomeAnalyticsEvent =
  | "authenticated_home_viewed"
  | "home_subject_search_opened"
  | "home_subject_selected"
  | "home_tutor_search_submitted"
  | "home_matching_started"
  | "home_learning_link_clicked"
  | "home_question_link_clicked"
  | "home_tutor_profile_opened"
  | "home_all_tutors_clicked"
  | "home_package_opened"
  | "home_continue_clicked"
  | "home_practice_opened"
  | "tutor_home_viewed"
  | "tutor_home_action_clicked"
  | "tutor_home_lesson_opened";

export type HomeAnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Provider-neutral analytics seam for the authenticated home. Consumers can
 * subscribe to `hocam:analytics` without this feature silently adding a
 * third-party tracking SDK or collecting personal data.
 */
export function trackHomeEvent(
  event: HomeAnalyticsEvent,
  properties: HomeAnalyticsProperties = {}
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("hocam:analytics", {
      detail: { event, properties },
    })
  );
}
