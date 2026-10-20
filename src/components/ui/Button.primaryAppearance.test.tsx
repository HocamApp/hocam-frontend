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

  it("fills a destructive button with the plain danger red, not the orange-leaning error colour, and never outlines it", () => {
    render(<Button variant="destructive">Koçluğu sonlandır</Button>);

    const className = screen.getByRole("button", { name: "Koçluğu sonlandır" }).className;
    assert.match(className, /\bbg-danger\b/);
    assert.match(className, /text-white/);
    assert.doesNotMatch(className, /bg-error|bg-transparent|border-error/);
  });
});
