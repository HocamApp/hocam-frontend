import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import { ShakeOnError } from "./ShakeOnError";

after(() => window.close());
afterEach(cleanup);

describe("ShakeOnError", () => {
  it("renders its children and a class for placement", () => {
    const { container } = render(
      <ShakeOnError trigger={0} className="max-w-sm">
        <input aria-label="sayı" />
      </ShakeOnError>
    );
    assert.ok(container.querySelector("input"));
    assert.match((container.firstElementChild as HTMLElement).className, /\bmax-w-sm\b/);
  });

  it("keeps the same input, and its focus, when the trigger changes", () => {
    const view = (trigger: number) => (
      <ShakeOnError trigger={trigger}>
        <input aria-label="sayı" />
      </ShakeOnError>
    );
    const { container, rerender } = render(view(0));
    const input = container.querySelector("input") as HTMLInputElement;
    input.focus();

    rerender(view(1));
    rerender(view(2));

    // A remount would drop the caret in the middle of typing.
    assert.equal(container.querySelector("input"), input);
    assert.equal(document.activeElement, input);
  });
});
