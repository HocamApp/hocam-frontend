import "@/test/setupDom";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";
import React, { useRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Coachmark } from "@/components/shared/Coachmark";
import { HintPanel } from "@/components/shared/HintPanel";

afterEach(cleanup);

function Harness({ forced, onAction, onDismiss }: { forced: boolean; onAction: () => void; onDismiss: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={ref}>Hedef</button>
      <Coachmark open anchorRef={ref} title="Başlık" stepLabel="Adım 1/2" actionLabel="İleri" forced={forced} onAction={onAction} onDismiss={onDismiss}>
        Açıklama
      </Coachmark>
    </>
  );
}

test("the bubble appears once its anchor is mounted and names the step", async () => {
  render(<Harness forced onAction={() => {}} onDismiss={() => {}} />);
  assert.ok(await screen.findByText("Başlık"));
  assert.ok(screen.getByText("Adım 1/2"));
  assert.ok(screen.getByText("Açıklama"));
});

test("the button is the way forward", async () => {
  let acted = 0;
  render(<Harness forced onAction={() => { acted += 1; }} onDismiss={() => {}} />);
  fireEvent.click(await screen.findByRole("button", { name: "İleri" }));
  assert.equal(acted, 1);
});

test("a forced coachmark ignores Escape and outside clicks", async () => {
  let dismissed = 0;
  render(<Harness forced onAction={() => {}} onDismiss={() => { dismissed += 1; }} />);
  const dialog = await screen.findByRole("dialog", { name: "Başlık" });
  fireEvent.keyDown(dialog, { key: "Escape" });
  fireEvent.pointerDown(document.body);
  assert.equal(dismissed, 0);
  assert.ok(screen.getByRole("dialog", { name: "Başlık" }));
});

test("a reminder closes on Escape", async () => {
  let dismissed = 0;
  render(<Harness forced={false} onAction={() => {}} onDismiss={() => { dismissed += 1; }} />);
  const dialog = await screen.findByRole("dialog", { name: "Başlık" });
  fireEvent.keyDown(dialog, { key: "Escape" });
  assert.equal(dismissed, 1);
});

test("nothing else on the page closes a bubble: not a click elsewhere, not focus moving away", async () => {
  for (const forced of [true, false]) {
    let dismissed = 0;
    const view = render(<Harness forced={forced} onAction={() => {}} onDismiss={() => { dismissed += 1; }} />);
    await screen.findByRole("dialog", { name: "Başlık" });
    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);
    const elsewhere = document.createElement("input");
    document.body.appendChild(elsewhere);
    elsewhere.focus();
    fireEvent.focusIn(elsewhere);
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(dismissed, 0, forced ? "forced" : "reminder");
    assert.ok(screen.getByRole("dialog", { name: "Başlık" }), forced ? "forced" : "reminder");
    elsewhere.remove();
    view.unmount();
  }
});

test("a control at the bottom of the screen can have the bubble above it", async () => {
  function Bottom() {
    const ref = useRef<HTMLButtonElement>(null);
    return (
      <>
        <button ref={ref}>Köşe</button>
        <Coachmark open anchorRef={ref} title="Köşe notu" actionLabel="Anladım" onAction={() => {}} side="top" align="end">Açıklama</Coachmark>
      </>
    );
  }
  render(<Bottom />);
  const dialog = await screen.findByRole("dialog", { name: "Köşe notu" });
  assert.ok(dialog);
});

test("the in-flow panel carries the same words and button", () => {
  let acknowledged = 0;
  render(<HintPanel title="Panel" onAcknowledge={() => { acknowledged += 1; }}>Gövde</HintPanel>);
  assert.ok(screen.getByText("Gövde"));
  fireEvent.click(screen.getByRole("button", { name: "Anladım" }));
  assert.equal(acknowledged, 1);
});

test("surface follows the brand rules: always-dark ink, no gradient, no scale, no stock icon set", () => {
  for (const file of ["Coachmark.tsx", "CoachmarkBody.tsx", "HintPanel.tsx"]) {
    const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /lucide/, file);
    assert.doesNotMatch(source, /gradient|backdrop-blur|zoom-in|scale-/, file);
    assert.doesNotMatch(source, /bg-ink\b|text-ink\b/, `${file} must not use the theme-flipping ink`);
  }
  const bubble = readFileSync(new URL("./Coachmark.tsx", import.meta.url), "utf8");
  assert.match(bubble, /bg-\[var\(--ink-on-light\)\]/);
  assert.match(bubble, /motion-reduce:animate-none/);
  assert.match(bubble, /shadow-float/);
});
