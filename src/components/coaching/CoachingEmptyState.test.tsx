import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CoachingEmptyState } from "./CoachingEmptyState";

after(() => window.close());
afterEach(cleanup);

describe("CoachingEmptyState", () => {
  it("renders a consistent contextual state with or without a route-specific icon", () => {
    render(<CoachingEmptyState title="Yaklaşan görüşme yok" description="Planlanan bir görüşme burada görünür." action={<button>Takvime dön</button>} />);
    assert.ok(screen.getByRole("heading", { name: "Yaklaşan görüşme yok" }));
    assert.ok(screen.getByText("Planlanan bir görüşme burada görünür."));
    assert.ok(screen.getByRole("button", { name: "Takvime dön" }));
  });
});
