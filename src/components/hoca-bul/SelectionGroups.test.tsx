import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { MultiSelectGroup, SingleSelectGroup } from "./SelectionGroups";

afterEach(cleanup);

const radioOptions = [
  { value: "first", label: "Birinci" },
  { value: "disabled", label: "Kapalı", disabled: true },
  { value: "third", label: "Üçüncü" },
] as const;

const toggleOptions = [
  { value: "first", label: "Birinci" },
  { value: "second", label: "İkinci" },
  { value: "third", label: "Üçüncü" },
] as const;

describe("SingleSelectGroup keyboard behavior", () => {
  function Fixture() {
    const [value, setValue] = useState<string>();
    return (
      <SingleSelectGroup
        label="Sıra seç"
        options={radioOptions}
        value={value}
        onValueChange={setValue}
        describedBy="single-help"
      />
    );
  }

  it("uses a radiogroup with roving tabindex and skips disabled options", () => {
    render(<Fixture />);
    const group = screen.getByRole("radiogroup", { name: "Sıra seç" });
    assert.equal(group.getAttribute("aria-describedby"), "single-help");
    const first = screen.getByRole("radio", { name: "Birinci" });
    const disabled = screen.getByRole("radio", { name: "Kapalı" });
    const third = screen.getByRole("radio", { name: "Üçüncü" });
    assert.equal(first.tabIndex, 0);
    assert.equal(disabled.tabIndex, -1);
    assert.equal(third.tabIndex, -1);

    first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    assert.equal(document.activeElement, third);
    assert.equal(third.getAttribute("aria-checked"), "true");
    assert.equal(first.tabIndex, -1);
    assert.equal(third.tabIndex, 0);

    fireEvent.keyDown(third, { key: "Home" });
    assert.equal(document.activeElement, first);
    assert.equal(first.getAttribute("aria-checked"), "true");

    fireEvent.keyDown(first, { key: "End" });
    assert.equal(document.activeElement, third);
    assert.equal(third.getAttribute("aria-checked"), "true");
  });

  it("selects the focused option with Space", () => {
    render(<Fixture />);
    const third = screen.getByRole("radio", { name: "Üçüncü" });
    third.focus();
    fireEvent.keyDown(third, { key: " " });
    assert.equal(third.getAttribute("aria-checked"), "true");
    assert.equal(document.activeElement, third);
  });
});

describe("MultiSelectGroup keyboard behavior", () => {
  function Fixture() {
    const [values, setValues] = useState<string[]>([]);
    return (
      <MultiSelectGroup
        label="Alan seç"
        options={toggleOptions}
        values={values}
        onValuesChange={setValues}
        maximum={2}
        describedBy="multi-help multi-error"
      />
    );
  }

  it("uses named group and toggle-button semantics for Space and Enter", () => {
    render(<Fixture />);
    const group = screen.getByRole("group", { name: "Alan seç" });
    assert.equal(group.getAttribute("aria-describedby"), "multi-help multi-error");
    const first = screen.getByRole("button", { name: "Birinci" });
    const third = screen.getByRole("button", { name: "Üçüncü" });

    first.focus();
    fireEvent.keyDown(first, { key: " " });
    assert.equal(first.getAttribute("aria-pressed"), "true");
    fireEvent.keyDown(third, { key: "Enter" });
    assert.equal(third.getAttribute("aria-pressed"), "true");
    assert.equal(screen.queryByRole("checkbox"), null);
  });

  it("does not allow a selection beyond the maximum and reports the limit", () => {
    render(<Fixture />);
    fireEvent.click(screen.getByRole("button", { name: "Birinci" }));
    fireEvent.click(screen.getByRole("button", { name: "İkinci" }));
    fireEvent.click(screen.getByRole("button", { name: "Üçüncü" }));

    assert.equal(screen.getByRole("button", { name: "Üçüncü" }).getAttribute("aria-pressed"), "false");
    assert.ok(screen.getByText("En fazla 2 seçim yapabilirsin."));
  });
});
