import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  coachingEarningStatusCopy,
  extractCoachingErrorCode,
  extractCoachingErrorMessage,
  readCoachingSelectedFromSearchParams,
  shouldSkipCoachingChoiceScreen,
  type CoachingEligibility,
} from "./coachingApi";

describe("coachingEarningStatusCopy", () => {
  it("maps internal accounting states without claiming bank settlement", () => {
    assert.equal(coachingEarningStatusCopy("eligible_unfunded"), "Kazanç hesabına uygun · kullanılabilir ödeme fonu doğrulanmadı");
    assert.equal(coachingEarningStatusCopy("pending"), "Aylık değerlendirmede");
    assert.equal(coachingEarningStatusCopy("on_hold"), "İnceleme nedeniyle bekliyor");
    assert.equal(coachingEarningStatusCopy("reversed"), "Muhasebe kaydı geri çevrildi");
    assert.equal(coachingEarningStatusCopy("ready"), "Aktarım hazırlığında · banka ödemesi doğrulanmadı");
    assert.equal(coachingEarningStatusCopy("paid"), "Sistem kaydında işlendi · banka aktarımı ayrıca doğrulanmalı");
    assert.equal(coachingEarningStatusCopy("unexpected"), "Kazanç durumu inceleniyor");
  });
});

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
  it("uses a dynamic server validation message instead of a hardcoded price policy", () => {
    assert.equal(
      extractCoachingErrorMessage(
        axiosError({
          code: ["price_exceeds_cap"],
          detail: "Koçluk görüşme fiyatı ders fiyatının en fazla %72'si olabilir.",
        })
      ),
      "Koçluk görüşme fiyatı ders fiyatının en fazla %72'si olabilir."
    );
  });

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

function eligibility(
  overrides: Partial<CoachingEligibility>
): CoachingEligibility {
  return {
    eligible: false,
    reason: "no_plan",
    message: "",
    plan: null,
    ...overrides,
  };
}

const plan: CoachingEligibility["plan"] = {
  frequency: "weekly",
  session_duration_minutes: 30,
  price_per_session_minor: 10000,
  price_per_session_display: "100 TL",
  is_free: false,
  target_exam_types: ["YKS"],
  description: "",
};

describe("shouldSkipCoachingChoiceScreen", () => {
  it("skips the screen when the tutor has no coaching plan at all (§14.1)", () => {
    assert.equal(
      shouldSkipCoachingChoiceScreen(eligibility({ reason: "no_plan", plan: null })),
      true
    );
  });

  it("skips the screen on an exam group mismatch (§14.5) even though a plan is returned", () => {
    assert.equal(
      shouldSkipCoachingChoiceScreen(
        eligibility({ reason: "exam_mismatch", plan })
      ),
      true
    );
  });

  it("does NOT skip the screen when the student is just missing an exam target (§14.6)", () => {
    assert.equal(
      shouldSkipCoachingChoiceScreen(
        eligibility({ reason: "missing_target_exam", plan, available_exam_targets: ["YKS"] })
      ),
      false
    );
  });

  it("does NOT skip the screen for an ordinary blocked-but-shown reason (capacity full)", () => {
    assert.equal(
      shouldSkipCoachingChoiceScreen(eligibility({ reason: "capacity_full", plan })),
      false
    );
  });

  it("does NOT skip the screen when eligible", () => {
    assert.equal(
      shouldSkipCoachingChoiceScreen(eligibility({ eligible: true, reason: "ok", plan })),
      false
    );
  });

  it("skips the screen when eligibility hasn't loaded yet or has no plan", () => {
    assert.equal(shouldSkipCoachingChoiceScreen(null), true);
    assert.equal(shouldSkipCoachingChoiceScreen(undefined), true);
    assert.equal(
      shouldSkipCoachingChoiceScreen(eligibility({ reason: "ok", plan: null })),
      true
    );
  });
});

describe("readCoachingSelectedFromSearchParams", () => {
  it("§14.7: a returning checkout session (via Düzenle or back) sees the prior choice, not a reset", () => {
    assert.equal(
      readCoachingSelectedFromSearchParams(new URLSearchParams("coaching=1")),
      true
    );
    assert.equal(
      readCoachingSelectedFromSearchParams(
        new URLSearchParams("coaching=1&per_week=2&duration=90")
      ),
      true
    );
  });

  it("defaults to unselected on a fresh entry with no coaching param", () => {
    assert.equal(readCoachingSelectedFromSearchParams(new URLSearchParams("")), false);
    assert.equal(
      readCoachingSelectedFromSearchParams(new URLSearchParams("per_week=2")),
      false
    );
  });

  it("only the exact '1' value counts as selected", () => {
    assert.equal(
      readCoachingSelectedFromSearchParams(new URLSearchParams("coaching=0")),
      false
    );
    assert.equal(
      readCoachingSelectedFromSearchParams(new URLSearchParams("coaching=true")),
      false
    );
  });
});
