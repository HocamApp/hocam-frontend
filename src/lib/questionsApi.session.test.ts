import assert from "node:assert/strict";
import { mock, test } from "node:test";

// This file mocks the shared axios instance BEFORE importing questionsApi, so
// it must not statically import questionsApi (that would bind the real client).

type PostCall = { url: string; body: unknown };

test("submitLessonQuestionAnswer posts the choice, question id and version", async () => {
  const calls: PostCall[] = [];
  const fakeState = { active_question: null, version: 4 };
  mock.module("./api", {
    defaultExport: {
      post: async (url: string, body: unknown) => {
        calls.push({ url, body });
        return { data: fakeState };
      },
    },
  });

  const { submitLessonQuestionAnswer } = await import("./questionsApi");
  const result = await submitLessonQuestionAnswer("booking-1", {
    selected_choice: "C",
    question_id: "q-9",
    version: 4,
  });

  assert.deepEqual(calls, [
    {
      url: "/bookings/booking-1/question-session/answer/",
      body: { selected_choice: "C", question_id: "q-9", version: 4 },
    },
  ]);
  assert.equal(result.version, 4);
  mock.reset();
});
