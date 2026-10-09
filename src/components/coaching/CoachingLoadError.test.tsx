import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CoachingLoadError } from "./CoachingLoadError";

after(() => window.close());
afterEach(cleanup);

describe("CoachingLoadError", () => {
  it("announces the failure and retries on request", () => {
    let retries = 0;
    render(<CoachingLoadError message="Görüşmeler yüklenemedi." onRetry={() => { retries += 1; }} />);
    assert.ok(screen.getByRole("alert").textContent?.includes("Görüşmeler yüklenemedi."));
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    assert.equal(retries, 1);
  });

  it("does not offer a second retry while one is running", () => {
    render(<CoachingLoadError onRetry={() => {}} isRetrying />);
    assert.equal((screen.getByRole("button", { name: "Tekrar dene" }) as HTMLButtonElement).disabled, true);
  });
});
