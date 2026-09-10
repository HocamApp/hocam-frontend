import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { TutorProfile } from "@/types";
import { TutorCard } from "./TutorCard";

Object.defineProperty(globalThis, "self", {
  configurable: true,
  value: window,
});

afterEach(cleanup);

const tutor: TutorProfile = {
  id: "tutor-1",
  user: "tutor-user-1",
  name: "Mehmet",
  surname: "Demir",
  profile_picture: "",
  intro_video_url: "",
  bio: "Matematik derslerinde sınava hazırlık desteği veriyorum.",
  university: "Boğaziçi Üniversitesi",
  department: "Elektrik-Elektronik Mühendisliği",
  yks_rank: 1240,
  hourly_price: 980,
  rating: 4.9,
  total_reviews: 41,
  completed_lessons_count: 7,
  has_taken_lesson: false,
  is_verified: true,
  is_public: true,
  teaching_styles: [],
  teaching_attributes: [],
  accepting_new_students: false,
  open_student_slots: 0,
  accepts_trial_lessons: false,
  is_bookable: false,
  is_online: true,
  subjects: [{ id: "subject-1", name: "Matematik", exam_type: "TYT" }],
  created_at: "2026-09-01T00:00:00Z",
};

test("large tutor card keeps profile navigation separate from direct trial booking", () => {
  const trialStarts: TutorProfile[] = [];
  render(
    <TutorCard
      tutor={tutor}
      size="lg"
      onStartTrial={(selectedTutor) => trialStarts.push(selectedTutor)}
    />,
  );

  const profile = screen.getByRole("link", { name: /Profili Gör/i });
  const trial = screen.getByRole("button", { name: "Deneme Dersi Al" });

  assert.equal(profile.getAttribute("href"), "/tutors/tutor-1");
  assert.equal(trial.closest("a"), null);

  fireEvent.click(trial);
  assert.deepEqual(trialStarts, [tutor]);
});

test("large tutor card shows the trial action even when list data says it is unavailable", () => {
  render(<TutorCard tutor={tutor} size="lg" onStartTrial={() => undefined} />);

  assert.ok(screen.getByRole("button", { name: "Deneme Dersi Al" }));
});

test("compact tutor card also keeps profile navigation separate from direct trial booking", () => {
  const trialStarts: TutorProfile[] = [];
  render(
    <TutorCard
      tutor={tutor}
      onStartTrial={(selectedTutor) => trialStarts.push(selectedTutor)}
    />,
  );

  assert.equal(screen.getByRole("link", { name: /Profili Gör/i }).getAttribute("href"), "/tutors/tutor-1");
  const trial = screen.getByRole("button", { name: "Deneme Dersi Al" });
  assert.equal(trial.closest("a"), null);
  fireEvent.click(trial);
  assert.deepEqual(trialStarts, [tutor]);
});

test("both tutor actions share the design-system button geometry and hierarchy", () => {
  render(<TutorCard tutor={tutor} size="lg" onStartTrial={() => undefined} />);

  const profile = screen.getByRole("link", { name: /Profili Gör/i });
  const trial = screen.getByRole("button", { name: "Deneme Dersi Al" });

  for (const action of [profile, trial]) {
    assert.equal(action.classList.contains("h-10"), true);
    assert.equal(action.classList.contains("rounded-pill"), true);
  }
  assert.equal(profile.classList.contains("bg-pink"), true);
  assert.equal(trial.classList.contains("border-ink"), true);
});
