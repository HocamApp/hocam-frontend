import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  GOOGLE_CALENDAR_RESULT_PARAM,
  googleCalendarCallbackToast,
  stripGoogleCalendarParam,
} from "./useGoogleCalendarCallbackResult";

describe("googleCalendarCallbackToast", () => {
  it("reports a successful connection", () => {
    const feedback = googleCalendarCallbackToast("connected");

    assert.equal(feedback?.kind, "success");
    assert.ok(feedback?.message.includes("Google Calendar"));
  });

  it("reports a generic, safe failure", () => {
    const feedback = googleCalendarCallbackToast("error");

    assert.equal(feedback?.kind, "error");
    assert.equal(feedback?.message.includes("@"), false);
    assert.equal(feedback?.message.toLowerCase().includes("token"), false);
    assert.equal(feedback?.message.toLowerCase().includes("state"), false);
  });

  it("explains an expired or replayed connect session", () => {
    const feedback = googleCalendarCallbackToast("invalid_state");

    assert.equal(feedback?.kind, "error");
    assert.ok(feedback?.message.includes("süresi dolmuş"));
  });

  it("stays silent for unknown or missing values", () => {
    assert.equal(googleCalendarCallbackToast(null), null);
    assert.equal(googleCalendarCallbackToast(""), null);
    assert.equal(googleCalendarCallbackToast("something-else"), null);
  });
});

describe("stripGoogleCalendarParam", () => {
  it("removes only the callback marker", () => {
    const result = stripGoogleCalendarParam(
      `${GOOGLE_CALENDAR_RESULT_PARAM}=connected`
    );

    assert.equal(result, "");
  });

  it("keeps every other query parameter", () => {
    const result = stripGoogleCalendarParam(
      "learning_goal_id=goal-1&google_calendar=error&discovery_impression_id=imp-9"
    );

    const params = new URLSearchParams(result);
    assert.equal(params.get("learning_goal_id"), "goal-1");
    assert.equal(params.get("discovery_impression_id"), "imp-9");
    assert.equal(params.has(GOOGLE_CALENDAR_RESULT_PARAM), false);
    assert.ok(result.startsWith("?"));
  });

  it("leaves an untouched query string alone", () => {
    const result = stripGoogleCalendarParam("tab=bookings");

    assert.equal(result, "?tab=bookings");
  });

  it("handles an empty query string", () => {
    assert.equal(stripGoogleCalendarParam(""), "");
  });
});
