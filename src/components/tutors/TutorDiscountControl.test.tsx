import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TutorDiscountControl, defaultMarkerLeft } from "./TutorDiscountControl";

afterEach(cleanup);

const props = {
  label: "Haftada 2 · 6 Ay",
  catalogDiscount: 26,
  maxDiscount: 40,
  price: "28.416 ₺",
  lessonCount: 48,
  disabled: false,
  onChange: (_value: number) => {},
};

test("keeps the whole 0–40 range while moving below and back to a 26 percent default", () => {
  const values: number[] = [];
  const onChange = (value: number) => values.push(value);
  const { rerender } = render(<TutorDiscountControl {...props} discount={26} onChange={onChange} />);
  const slider = screen.getByRole("slider", { name: /Haftada 2 · 6 Ay indirimi/ });
  assert.equal(slider.getAttribute("aria-valuemax"), "40");
  assert.equal(slider.getAttribute("aria-valuenow"), "26");
  assert.ok(screen.getByText("Varsayılan: %26"));
  assert.equal(screen.queryByText(/Daha düşük indirim/), null);

  rerender(<TutorDiscountControl {...props} discount={16} onChange={onChange} />);
  assert.equal(slider.getAttribute("aria-valuemax"), "40");
  assert.ok(screen.getByText(/Daha düşük indirim, paketin fiyatını artırır/));
  fireEvent.keyDown(slider, { key: "ArrowRight" });
  assert.equal(values.at(-1), 17);

  rerender(<TutorDiscountControl {...props} discount={26} onChange={onChange} />);
  assert.equal(screen.queryByText(/Daha düşük indirim/), null);
});

test("marks a 30 percent default inside the range, with 40 at the end", () => {
  const { rerender } = render(<TutorDiscountControl {...props} catalogDiscount={30} discount={30} />);
  assert.equal(screen.getByRole("slider").getAttribute("aria-valuenow"), "30");
  assert.equal(screen.getByLabelText("Varsayılan indirim: %30").getAttribute("style"), "left: calc(75% - 5px);");
  rerender(<TutorDiscountControl {...props} catalogDiscount={30} discount={20} />);
  assert.ok(screen.getByText(/Daha düşük indirim/));
  rerender(<TutorDiscountControl {...props} catalogDiscount={30} discount={40} />);
  assert.equal(screen.queryByText(/Daha düşük indirim/), null);
  assert.ok(screen.getAllByText("%40").length > 0);
});

test("the default marker follows the thumb: Radix keeps the thumb half a thumb inside the track", () => {
  // thumb centre = p% + (10 - 0.2p)px for a 20px thumb
  assert.equal(defaultMarkerLeft(0, 40), "calc(0% + 10px)");
  assert.equal(defaultMarkerLeft(20, 40), "calc(50% + 0px)");
  assert.equal(defaultMarkerLeft(26, 40), "calc(65% - 3px)");
  assert.equal(defaultMarkerLeft(30, 40), "calc(75% - 5px)");
  assert.equal(defaultMarkerLeft(40, 40), "calc(100% - 10px)");
});

test("a default outside the range stays inside the control", () => {
  assert.equal(defaultMarkerLeft(-5, 40), "calc(0% + 10px)");
  assert.equal(defaultMarkerLeft(80, 40), "calc(100% - 10px)");
});

test("the lower-discount hint is plain text, not a boxed alert", () => {
  const { container } = render(<TutorDiscountControl {...props} discount={10} />);
  const hint = screen.getByRole("status");
  assert.match(hint.textContent ?? "", /Daha düşük indirim, paketin fiyatını artırır/);
  assert.equal(container.querySelector('[role="alert"]'), null);
  assert.doesNotMatch(hint.className, /border|bg-|rounded|amber/);
  assert.ok(hint.querySelector("svg"), "one small icon beside the text");
});

test("the marker is dimmed with the slider while it is saving", () => {
  const { rerender } = render(<TutorDiscountControl {...props} discount={26} disabled={false} />);
  assert.doesNotMatch(screen.getByLabelText("Varsayılan indirim: %26").className, /opacity-50/);
  rerender(<TutorDiscountControl {...props} discount={26} disabled />);
  assert.match(screen.getByLabelText("Varsayılan indirim: %26").className, /opacity-50/);
});
