import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import type { SolvableQuestion } from "@/types";
import { QuestionCard } from "./QuestionCard";

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});

const question: SolvableQuestion = {
  id: "q1",
  exam_type: "AYT",
  exam_year: 2027,
  subject: {
    id: "physics",
    name: "Fizik",
    exam_type: "AYT",
  },
  topic: {
    id: "modern-physics",
    title: "Modern Fizik",
    exam_type: "AYT",
    subject_name: "Fizik",
  },
  source_book: "Kaynak kitap",
  original_question_number: "9",
  prompt: "Fotoelektrik olayla ilgili soru",
  choices: [],
  question_image_url: "",
  difficulty: "medium",
  attribution: "",
  source_url: "",
};

after(() => window.close());
afterEach(() => cleanup());

test("question card shows only subject and topic metadata", () => {
  render(<QuestionCard question={question} returnTo="/cikmis-sorular" />);

  assert.ok(screen.getByText("Fizik"));
  assert.ok(screen.getByText("Modern Fizik"));
  assert.equal(screen.queryByText(/AYT 2027/), null);
  assert.equal(screen.queryByText(/Soru 9/), null);
  assert.equal(screen.queryByText("Kaynak kitap"), null);
});
