import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import { HomeCardRow } from "./HomeCardRow";

afterEach(() => {
  cleanup();
});

function rowElement(container: HTMLElement) {
  return container.firstElementChild as HTMLElement | null;
}

describe("HomeCardRow", () => {
  it("renders nothing when it has no cards, so an empty section leaves no gap", () => {
    const { container } = render(<HomeCardRow>{[]}</HomeCardRow>);
    assert.equal(container.firstElementChild, null);
  });

  it("renders one wrapper per card", () => {
    const { container } = render(
      <HomeCardRow>
        <div data-testid="card">a</div>
        <div data-testid="card">b</div>
        <div data-testid="card">c</div>
      </HomeCardRow>
    );
    assert.equal(rowElement(container)?.children.length, 3);
  });

  it("scrolls horizontally on mobile and becomes a grid from md up", () => {
    const { container } = render(
      <HomeCardRow>
        <div>a</div>
      </HomeCardRow>
    );
    const className = rowElement(container)?.className ?? "";
    assert.ok(className.includes("overflow-x-auto"));
    assert.ok(className.includes("snap-x"));
    assert.ok(className.includes("md:grid"));
    assert.ok(className.includes("md:overflow-visible"));
  });

  it("keeps every card in a min-w-0 track so a row cannot widen the page", () => {
    const { container } = render(
      <HomeCardRow>
        <div>a</div>
        <div>b</div>
      </HomeCardRow>
    );
    const wrappers = Array.from(rowElement(container)?.children ?? []);
    assert.equal(wrappers.length, 2);
    for (const wrapper of wrappers) {
      assert.ok(wrapper.className.includes("min-w-0"));
      assert.ok(wrapper.className.includes("snap-start"));
    }
  });

  it("uses two tablet columns and three only at xl for the default row", () => {
    const { container } = render(
      <HomeCardRow>
        <div>a</div>
      </HomeCardRow>
    );
    const className = rowElement(container)?.className ?? "";
    assert.ok(className.includes("md:[grid-template-columns:repeat(2,minmax(0,1fr))]"));
    assert.ok(className.includes("xl:[grid-template-columns:repeat(3,minmax(0,1fr))]"));
  });

  it("stays at two columns when asked for a two-column row", () => {
    const { container } = render(
      <HomeCardRow columns={2}>
        <div>a</div>
      </HomeCardRow>
    );
    const className = rowElement(container)?.className ?? "";
    assert.ok(!className.includes("xl:[grid-template-columns:repeat(3,minmax(0,1fr))]"));
  });
});
