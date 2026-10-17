import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TutorDiscountControl } from "./TutorDiscountControl";

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
  assert.equal(screen.getByLabelText("Varsayılan indirim: %30").getAttribute("style"), "left: 75%;");
  rerender(<TutorDiscountControl {...props} catalogDiscount={30} discount={20} />);
  assert.ok(screen.getByText(/Daha düşük indirim/));
  rerender(<TutorDiscountControl {...props} catalogDiscount={30} discount={40} />);
  assert.equal(screen.queryByText(/Daha düşük indirim/), null);
  assert.ok(screen.getAllByText("%40").length > 0);
});
