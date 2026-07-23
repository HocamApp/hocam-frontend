import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, mock, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { Booking, LessonQuestionState, SolvableQuestion } from "@/types";

const question: SolvableQuestion = {
  id: "q1",
  exam_type: "TYT",
  exam_year: 2023,
  subject: { id: "s1", name: "Matematik", exam_type: "TYT" },
  topic: null,
  source_book: "",
  original_question_number: "1",
  prompt: "2 + 2 kaçtır?",
  choices: [
    { key: "A", text: "3" },
    { key: "B", text: "4" },
  ],
  question_image_url: "",
  difficulty: "easy",
  attribution: "Kaynak",
  source_url: "",
};

const silentToast = Object.assign(() => {}, {
  success: () => {},
  info: () => {},
  error: () => {},
});

let currentRole: "student" | "tutor" = "tutor";
let Panel: (props: Record<string, unknown>) => React.ReactNode;

async function ensurePanel() {
  if (Panel) return;
  mock.module("@/hooks/useAuth", {
    namedExports: { useAuth: () => ({ user: { role: currentRole } }) },
  });
  mock.module("sonner", { namedExports: { toast: silentToast } });
  mock.module("@/lib/questionsApi", {
    namedExports: {
      fetchQuestions: async () => ({
        results: [],
        count: 0,
        next: null,
        previous: null,
      }),
      submitQuestionAttempt: async () => ({}),
      revealQuestion: async () => ({}),
    },
  });
  Panel = (await import("./LessonQuestionPanel"))
    .LessonQuestionPanel as unknown as typeof Panel;
}

const booking = {
  id: "b1",
  subject: { id: "s1", name: "Matematik" },
} as unknown as Booking;

function makeState(overrides: Partial<LessonQuestionState>): LessonQuestionState {
  return {
    active_question: question,
    answer_revealed_to_student: false,
    solution_revealed: false,
    correct_choice: "",
    student_answer: "",
    student_answer_at: null,
    version: 3,
    updated_at: "2026-07-22T10:00:00Z",
    ...overrides,
  };
}

function makeSession(
  state: LessonQuestionState,
  updates: Array<Record<string, unknown>>
) {
  return {
    state,
    stateIsLoading: false,
    stateIsError: false,
    updatePending: false,
    clearPending: false,
    submitPending: false,
    panelOpen: true,
    invitationOpen: false,
    refetchState: () => {},
    updateState: (payload: Record<string, unknown>) => updates.push(payload),
    submitAnswer: () => {},
    clearState: () => {},
    openPanel: () => {},
    closePanel: () => {},
    acceptInvitation: () => {},
    dismissInvitation: () => {},
  };
}

async function renderPanel(
  state: LessonQuestionState,
  role: "student" | "tutor",
  updates: Array<Record<string, unknown>> = []
) {
  currentRole = role;
  await ensurePanel();
  const client = new QueryClient();
  render(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(Panel, {
        booking,
        session: makeSession(state, updates),
        onClose: () => {},
      })
    )
  );
}

after(() => window.close());
afterEach(() => cleanup());

test("tutor sees the student's answer and private solution, with a single reveal toggle", async () => {
  const updates: Array<Record<string, unknown>> = [];
  await renderPanel(
    makeState({
      student_answer: "B",
      student_answer_at: "2026-07-22T10:05:00Z",
      teacher_correct_choice: "B",
      teacher_answer: "4",
      teacher_explanation: "İki sayının toplamı.",
      teacher_solution_url: "https://mebi.example/solution",
    }),
    "tutor",
    updates
  );

  assert.ok(screen.getByText(/Öğrencinin cevabı:/));
  assert.ok(screen.getByText("Yalnızca öğretmen görünümü"));
  assert.ok(screen.getByText(/Doğru cevap:/));
  assert.ok(screen.getByText("İki sayının toplamı."));

  const toggle = screen.getByRole("button", { name: /Cevabı öğrenciye göster/ });
  fireEvent.click(toggle);
  assert.deepEqual(updates, [{ answer_revealed_to_student: true }]);
});

test("tutor toggle flips to hide once the answer is revealed", async () => {
  await renderPanel(
    makeState({ answer_revealed_to_student: true, correct_choice: "B" }),
    "tutor"
  );
  assert.ok(screen.getByRole("button", { name: /Cevabı öğrenciden gizle/ }));
  assert.equal(screen.queryByRole("button", { name: /Cevabı öğrenciye göster/ }), null);
});

test("student never sees the teacher-only answer/solution block", async () => {
  await renderPanel(makeState({ student_answer: "A" }), "student");
  assert.equal(screen.queryByText("Yalnızca öğretmen görünümü"), null);
  assert.equal(screen.queryByText(/Öğrencinin cevabı:/), null);
  assert.equal(screen.queryByRole("button", { name: /Cevabı öğrenciye göster/ }), null);
  // The student keeps their own submit control.
  assert.ok(screen.getByRole("button", { name: "Cevabımı güncelle" }));
});
