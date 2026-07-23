import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, mock, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { SolvableQuestion } from "@/types";

const question: SolvableQuestion = {
  id: "q1",
  exam_type: "TYT",
  exam_year: 2023,
  subject: null,
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

let currentRole: "student" | "tutor" = "student";
let Viewer: (props: Record<string, unknown>) => React.ReactNode;

async function ensureViewer() {
  if (Viewer) return;
  mock.module("@/hooks/useAuth", {
    namedExports: { useAuth: () => ({ user: { role: currentRole } }) },
  });
  mock.module("sonner", { namedExports: { toast: silentToast } });
  Viewer = (await import("./QuestionViewer"))
    .QuestionViewer as unknown as typeof Viewer;
}

async function renderViewer(
  props: Record<string, unknown>,
  role: "student" | "tutor"
) {
  currentRole = role;
  await ensureViewer();
  const client = new QueryClient();
  render(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(Viewer, { question, compact: true, ...props })
    )
  );
}

after(() => window.close());
afterEach(() => cleanup());

test("student live panel: no solution control, submits the chosen answer", async () => {
  const submitted: string[] = [];
  await renderViewer(
    {
      answerControl: "tutor-controlled",
      onSubmitAnswer: (choice: string) => submitted.push(choice),
    },
    "student"
  );

  assert.equal(screen.queryByText("Çözümü göster"), null);
  assert.equal(screen.queryByText("Yanıtı kontrol et"), null);

  fireEvent.click(screen.getByText("4")); // choice B
  fireEvent.click(screen.getByRole("button", { name: "Cevabımı gönder" }));
  assert.deepEqual(submitted, ["B"]);

  assert.equal(screen.queryByText(/Doğru cevap/), null);
});

test("student live panel: 'Cevabımı güncelle' label once an answer exists", async () => {
  await renderViewer(
    {
      answerControl: "tutor-controlled",
      onSubmitAnswer: () => {},
      submittedChoice: "A",
    },
    "student"
  );
  assert.ok(screen.getByRole("button", { name: "Cevabımı güncelle" }));
  assert.ok(screen.getByText("Gönderdiğin cevap:"));
  assert.equal(screen.queryByText("Çözümü göster"), null);
});

test("student live panel: correct choice shown only after reveal, submit hidden", async () => {
  await renderViewer(
    {
      answerControl: "tutor-controlled",
      onSubmitAnswer: () => {},
      submittedChoice: "A",
      revealedCorrectChoice: "B",
    },
    "student"
  );
  assert.equal(screen.queryByRole("button", { name: /Cevabımı/ }), null);
  const correctButton = screen.getByText("4").closest("button");
  assert.ok(correctButton);
  assert.match(correctButton.className, /emerald/);
});

test("tutor live panel: no student-submit control", async () => {
  await renderViewer(
    { answerControl: "tutor-controlled", onSubmitAnswer: () => {} },
    "tutor"
  );
  assert.equal(screen.queryByText("Cevabımı gönder"), null);
  assert.equal(screen.queryByText("Çözümü göster"), null);
  assert.equal(screen.queryByText("Yanıtı kontrol et"), null);
});
