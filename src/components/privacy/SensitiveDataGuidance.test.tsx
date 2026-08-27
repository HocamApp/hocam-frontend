import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import {
  SENSITIVE_DATA_GUIDANCE,
  SensitiveDataGuidance,
} from "./SensitiveDataGuidance";

afterEach(cleanup);

describe("sensitive data guidance", () => {
  it("renders as quiet helper text rather than an alert or dialog", () => {
    render(<SensitiveDataGuidance />);

    assert.ok(screen.getByText(SENSITIVE_DATA_GUIDANCE));
    assert.equal(screen.queryByRole("alert"), null);
    assert.equal(screen.queryByRole("dialog"), null);
    assert.equal(screen.queryByRole("checkbox"), null);
  });
});
