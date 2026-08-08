import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractCoachingErrorCode,
  extractCoachingErrorMessage,
} from "./coachingApi";

function axiosError(data: unknown, status = 400) {
  return { response: { status, data } };
}

describe("extractCoachingErrorCode", () => {
  it("reads a plain string code from a view-built payload", () => {
    assert.equal(
      extractCoachingErrorCode(axiosError({ code: "availability_required" })),
      "availability_required"
    );
  });

  it("unwraps the array DRF puts around serializer error values", () => {
    assert.equal(
      extractCoachingErrorCode(axiosError({ code: ["price_exceeds_cap"] })),
      "price_exceeds_cap"
    );
  });

  it("returns null when there is no code", () => {
    assert.equal(extractCoachingErrorCode(axiosError({ detail: "nope" })), null);
    assert.equal(extractCoachingErrorCode(new Error("network")), null);
  });
});

describe("extractCoachingErrorMessage", () => {
  it("prefers the known message for a recognised code", () => {
    const message = extractCoachingErrorMessage(
      axiosError({ code: "availability_required" })
    );
    assert.match(message, /müsaitliği/i);
  });

  it("falls back to the server's detail string", () => {
    assert.equal(
      extractCoachingErrorMessage(axiosError({ detail: "Sunucudan gelen mesaj." })),
      "Sunucudan gelen mesaj."
    );
  });

  it("surfaces the structured description guardrail message", () => {
    const message = extractCoachingErrorMessage(
      axiosError({
        description: [
          {
            code: "description_forbidden_pattern",
            rule: "unlimited_questions",
            message: "Sınırsız soru çözümü vaadi veremezsin.",
          },
        ],
      })
    );
    assert.equal(message, "Sınırsız soru çözümü vaadi veremezsin.");
  });

  it("falls back to a generic message when nothing is usable", () => {
    assert.equal(
      extractCoachingErrorMessage(new Error("boom")),
      "Beklenmeyen bir hata oluştu."
    );
  });

  it("does not surface a single HTML character for a non-JSON (HTML) error body", () => {
    // Regression: a raw HTML error page (e.g. a dev-mode 500) as response
    // data used to fall through to Object.values(htmlString), which
    // iterates the string's characters and returned "<" as the "message".
    const message = extractCoachingErrorMessage(
      axiosError("<!DOCTYPE html><html>...</html>", 500)
    );
    assert.equal(message, "Beklenmeyen bir hata oluştu.");
  });
});
