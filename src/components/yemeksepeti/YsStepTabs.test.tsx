import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { studentSteps } from "./YsHowItWorks";
import { YsStepTabs } from "./YsStepTabs";
import { students } from "./ysHomeCopy";

afterEach(() => act(() => cleanup()));
after(() => window.close());

/* The wide-screen frame: the only element with role="tabpanel". */
function visibleShot() {
  const panel = screen.getByRole("tabpanel", { hidden: true });
  const shown = Array.from(panel.querySelectorAll("img")).filter((img) => img.getAttribute("aria-hidden") !== "true");
  assert.equal(shown.length, 1, "exactly one screenshot is visible");
  return shown[0].getAttribute("src") ?? "";
}

describe("student steps", () => {
  it("maps each step to its screenshot", () => {
    const files = studentSteps().map((step) => step.shot?.src.split("/").pop());
    assert.deepEqual(files, [
      "01-tutor-list.png",
      "02-nazli-profile.png",
      "02-nazli-profile.png",
      "03-package-selection.png",
      "03-package-selection.png",
      "04-lesson-dashboard.png",
      "04-lesson-dashboard.png",
    ]);
  });

  it("shows the lesson room for step 6 once its screenshot exists", () => {
    const files = studentSteps(true).map((step) => step.shot?.src.split("/").pop());
    assert.equal(files[5], "05-lesson-room.png");
    assert.equal(files[6], "04-lesson-dashboard.png");
  });

  it("captions the frame with the active step's number", () => {
    assert.equal(studentSteps()[2].shot?.caption, "03 · Hoca profili");
  });
});

describe("YsStepTabs", () => {
  it("puts every step's body in the server HTML", () => {
    const html = renderToStaticMarkup(<YsStepTabs label={students.stepsLabel} steps={studentSteps()} />);
    for (const step of studentSteps()) {
      assert.ok(html.includes(step.title as string), step.title as string);
    }
    assert.match(html, /Ders, sınav türü, üniversite, fiyat ve YKS sıralamasına göre filtrele/);
    assert.match(html, /Dersi puanla, yorumunu bırak/);
  });

  it("starts on the first step with one screenshot", () => {
    render(<YsStepTabs label={students.stepsLabel} steps={studentSteps()} />);
    const tabs = screen.getAllByRole("tab");
    assert.equal(tabs.length, 7);
    assert.equal(tabs[0].getAttribute("aria-selected"), "true");
    assert.equal(tabs.filter((tab) => tab.getAttribute("aria-selected") === "true").length, 1);
    assert.match(visibleShot(), /01-tutor-list\.png/);
  });

  it("switches the screenshot on click", () => {
    render(<YsStepTabs label={students.stepsLabel} steps={studentSteps()} />);
    act(() => fireEvent.click(screen.getAllByRole("tab")[3]));
    const tabs = screen.getAllByRole("tab");
    assert.equal(tabs[3].getAttribute("aria-selected"), "true");
    assert.equal(tabs[0].getAttribute("aria-selected"), "false");
    assert.match(visibleShot(), /03-package-selection\.png/);
  });

  it("moves with the arrow keys and wraps around", () => {
    render(<YsStepTabs label={students.stepsLabel} steps={studentSteps()} />);
    const tabs = () => screen.getAllByRole("tab");
    act(() => fireEvent.keyDown(tabs()[0], { key: "ArrowDown" }));
    assert.equal(tabs()[1].getAttribute("aria-selected"), "true");
    assert.equal(document.activeElement, tabs()[1]);
    assert.match(visibleShot(), /02-nazli-profile\.png/);
    act(() => fireEvent.keyDown(tabs()[1], { key: "ArrowUp" }));
    act(() => fireEvent.keyDown(tabs()[0], { key: "ArrowUp" }));
    assert.equal(tabs()[6].getAttribute("aria-selected"), "true");
    act(() => fireEvent.keyDown(tabs()[6], { key: "Home" }));
    assert.equal(tabs()[0].getAttribute("aria-selected"), "true");
  });

  it("keeps only the active step in the tab order", () => {
    render(<YsStepTabs label={students.stepsLabel} steps={studentSteps()} />);
    const tabbable = screen.getAllByRole("tab").filter((tab) => tab.tabIndex === 0);
    assert.equal(tabbable.length, 1);
  });

  it("shows the active step's screenshot under it for narrow screens", () => {
    const { container } = render(<YsStepTabs label={students.stepsLabel} steps={studentSteps()} />);
    act(() => fireEvent.click(screen.getAllByRole("tab")[4]));
    const inline = container.querySelectorAll("[role=tablist] figure");
    assert.equal(inline.length, 1);
    assert.ok(inline[0].className.includes("min-[960px]:hidden"));
    assert.match(inline[0].querySelector("img")?.getAttribute("src") ?? "", /03-package-selection\.png/);
  });

  it("renders no frame for steps without screenshots", () => {
    const steps = studentSteps().map(({ title, body }) => ({ title, body }));
    const { container } = render(<YsStepTabs label="x" steps={steps} />);
    assert.equal(container.querySelector("[role=tabpanel]"), null);
    assert.equal(container.querySelectorAll("img").length, 0);
  });
});
