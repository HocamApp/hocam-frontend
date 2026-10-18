import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React, { useRef } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { UiHintKey, UiHintRecord, UiHints } from "@/lib/tutorSetupHints";

let hints: UiHints = {};
let ready = true;
const recorded: Array<[UiHintKey, UiHintRecord]> = [];
mock.module("@/hooks/useUiHints", { namedExports: { useUiHints: () => ({ hints, ready, record: (key: UiHintKey, patch: UiHintRecord) => { recorded.push([key, patch]); } }) } });

let Hint: typeof import("./PageIntroHint").PageIntroHint;
before(async () => { Hint = (await import("./PageIntroHint")).PageIntroHint; });
beforeEach(() => { hints = {}; ready = true; recorded.length = 0; });
afterEach(() => { cleanup(); document.querySelectorAll("[data-test-modal]").forEach((node) => node.remove()); });

function Page() {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <>
      <h1><span ref={ref}>Sınıfım</span></h1>
      <Hint hintKey="tutor_intro_classroom" anchorRef={ref} title="Öğrencilerin burada" delayMs={0}>Açıklama</Hint>
    </>
  );
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 40));

test("a page explains itself once, with a single button", async () => {
  render(<Page />);
  assert.ok(await screen.findByText("Öğrencilerin burada"));
  assert.equal(screen.queryByText(/Adım/), null);
  fireEvent.click(screen.getByRole("button", { name: "Anladım" }));
  await waitFor(() => assert.equal(screen.queryByText("Öğrencilerin burada"), null));
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0][0], "tutor_intro_classroom");
  assert.ok(recorded[0][1].acknowledged_at);
});

test("dismissing it any other way is also an answer, it does not come back on a schedule", async () => {
  render(<Page />);
  const dialog = await screen.findByRole("dialog", { name: "Öğrencilerin burada" });
  fireEvent.keyDown(dialog, { key: "Escape" });
  await waitFor(() => assert.equal(screen.queryByText("Öğrencilerin burada"), null));
  assert.equal(recorded.length, 1);
});

test("an answered page stays quiet", async () => {
  hints = { tutor_intro_classroom: { acknowledged_at: "2026-10-17T10:00:00Z" } };
  render(<Page />);
  await settle();
  assert.equal(screen.queryByText("Öğrencilerin burada"), null);
});

test("another page's answer does not silence this one", async () => {
  hints = { tutor_intro_calendar: { acknowledged_at: "2026-10-17T10:00:00Z" } };
  render(<Page />);
  assert.ok(await screen.findByText("Öğrencilerin burada"));
});

test("nothing shows until the hint state is ready", async () => {
  ready = false;
  render(<Page />);
  await settle();
  assert.equal(screen.queryByText("Öğrencilerin burada"), null);
  assert.equal(recorded.length, 0);
});

test("an open dialog postpones it", async () => {
  const modal = document.createElement("div");
  modal.setAttribute("role", "dialog"); modal.setAttribute("data-test-modal", "");
  document.body.appendChild(modal);
  render(<Page />);
  await settle();
  assert.equal(screen.queryByText("Öğrencilerin burada"), null);
  assert.equal(recorded.length, 0);
});
