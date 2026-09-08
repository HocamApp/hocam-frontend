import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { Button } from "./button";

after(() => window.close());
afterEach(cleanup);

describe("Button primary appearance", () => {
  it("keeps white text when the small type size is merged", () => {
    render(<Button size="sm">Katıl</Button>);

    assert.match(screen.getByRole("button", { name: "Katıl" }).className, /text-white/);
  });
});
