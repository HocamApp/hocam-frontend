import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import type { TutorProfile, User } from "@/types";
import { syncCreatedTutorProfile } from "./tutorSetup";

test("syncCreatedTutorProfile advances onboarding without replacing auth", () => {
  const queryClient = new QueryClient();
  const profile = { id: "profile-1" } as TutorProfile;
  const user = {
    id: "tutor-1",
    tutor_profile_id: "profile-1",
    impersonation: {
      actor_id: "admin-1",
      actor_email: "admin@example.com",
      target_id: "tutor-1",
      target_email: "qa-tutor@example.com",
    },
  } as User;
  const updatedUsers: User[] = [];

  syncCreatedTutorProfile(queryClient, profile, user, (nextUser) => {
    updatedUsers.push(nextUser);
  });

  assert.equal(queryClient.getQueryData(["tutor-me"]), profile);
  assert.deepEqual(updatedUsers, [user]);
  assert.equal(updatedUsers[0].impersonation?.actor_id, "admin-1");
});
