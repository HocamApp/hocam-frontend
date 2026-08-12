import type { QueryClient } from "@tanstack/react-query";
import type { TutorProfile, User } from "@/types";

/**
 * Keep the newly-created profile and refreshed user in client state without
 * replacing the active authentication session. This matters for admin QA:
 * setAuth intentionally ends impersonation, while profile setup must preserve
 * the short-lived tutor view until the onboarding test is finished.
 */
export function syncCreatedTutorProfile(
  queryClient: QueryClient,
  profile: TutorProfile,
  user: User,
  updateUser: (user: User) => void
) {
  queryClient.setQueryData(["tutor-me"], profile);
  updateUser(user);
}
