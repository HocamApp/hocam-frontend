import assert from "node:assert/strict";
import { describe, it } from "node:test";

import * as questionsApiModule from "./questionsApi";

type QuestionsApiErrors = {
  getQuestionSessionErrorMessage?: (
    error: unknown,
    fallback: string
  ) => string;
};

const questionsApi = questionsApiModule as QuestionsApiErrors;

describe("getQuestionSessionErrorMessage", () => {
  it("maps permission and active-lesson responses to clear Turkish messages", () => {
    assert.equal(typeof questionsApi.getQuestionSessionErrorMessage, "function");
    assert.equal(
      questionsApi.getQuestionSessionErrorMessage?.(
        { response: { status: 403 } },
        "fallback"
      ),
      "Bu derste soru paylaşma yetkin yok."
    );
    assert.equal(
      questionsApi.getQuestionSessionErrorMessage?.(
        { response: { status: 409 } },
        "fallback"
      ),
      "Bu ders artık aktif olmadığı için soru paylaşılamaz."
    );
  });

  it("uses a safe not-found message and preserves a fallback for unknown errors", () => {
    assert.equal(
      questionsApi.getQuestionSessionErrorMessage?.(
        { response: { status: 404 } },
        "fallback"
      ),
      "Ders veya paylaşılacak soru bulunamadı."
    );
    assert.equal(
      questionsApi.getQuestionSessionErrorMessage?.(new Error("offline"), "fallback"),
      "fallback"
    );
  });
});
