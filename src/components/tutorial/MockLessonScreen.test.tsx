import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getTutorialStep } from "@/lib/liveLessonTutorialSteps";
import { MockLessonScreen } from "./MockLessonScreen";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});
Object.defineProperty(window.HTMLElement.prototype, "scrollTo", {
  configurable: true,
  value: () => undefined,
});

after(() => window.close());
afterEach(cleanup);

describe("MockLessonScreen active surfaces", () => {
  it("follows the selected application theme instead of forcing Night mode", () => {
    const { container } = render(
      <MockLessonScreen
        activeStep={getTutorialStep("welcome")}
        onStepAction={() => undefined}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    assert.match(root.className, /bg-paper/);
    assert.doesNotMatch(root.className, /(^|\s)dark(\s|$)/);
  });

  it("keeps chat, notes, whiteboard and quality mutually exclusive", () => {
    render(
      <MockLessonScreen
        activeStep={getTutorialStep("chat")}
        onStepAction={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sohbeti aç/kapat" }));
    assert.ok(screen.getByRole("complementary", { name: /Ders sohbeti/ }));

    fireEvent.click(screen.getByRole("button", { name: "Öğrenci notları" }));
    assert.equal(
      Boolean(screen.queryByRole("complementary", { name: /Ders sohbeti/ })),
      false,
    );
    assert.ok(screen.getByRole("complementary", { name: /Öğrenci notları/ }));

    fireEvent.click(screen.getByRole("button", { name: "Tahtayı aç\/kapat" }));
    assert.equal(
      Boolean(screen.queryByRole("complementary", { name: /Öğrenci notları/ })),
      false,
    );
    assert.ok(screen.getByText("Beyaz tahta açık"));

    fireEvent.click(screen.getByRole("button", { name: "Görüntü ayarı" }));
    assert.equal(Boolean(screen.queryByText("Beyaz tahta açık")), false);
    assert.ok(screen.getByRole("dialog", { name: /Görüntü ayarı/ }));
  });

  it("cleans the previous step surface on forward and back navigation", async () => {
    const { rerender } = render(
      <MockLessonScreen
        activeStep={getTutorialStep("chat")}
        onStepAction={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sohbeti aç/kapat" }));
    assert.ok(screen.getByRole("complementary", { name: /Ders sohbeti/ }));

    rerender(
      <MockLessonScreen
        activeStep={getTutorialStep("screen-share")}
        onStepAction={() => undefined}
      />,
    );

    await waitFor(() => {
      assert.equal(
        Boolean(screen.queryByRole("complementary", { name: /Ders sohbeti/ })),
        false,
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Öğrenci notları" }));
    assert.ok(screen.getByRole("complementary", { name: /Öğrenci notları/ }));

    rerender(
      <MockLessonScreen
        activeStep={getTutorialStep("chat")}
        onStepAction={() => undefined}
      />,
    );

    await waitFor(() => {
      assert.equal(
        Boolean(screen.queryByRole("complementary", { name: /Öğrenci notları/ })),
        false,
      );
    });
  });

  it("uses a single readable active style and clears sharing on the next step", async () => {
    const { rerender } = render(
      <MockLessonScreen
        activeStep={getTutorialStep("screen-share")}
        onStepAction={() => undefined}
      />,
    );

    const shareButton = screen.getByRole("button", { name: "Ekran paylaş" });
    fireEvent.click(shareButton);
    assert.match(shareButton.className, /bg-success/);
    assert.match(shareButton.className, /text-white/);
    assert.doesNotMatch(shareButton.className, /bg-surface/);
    assert.doesNotMatch(shareButton.className, /text-ink/);
    assert.doesNotMatch(shareButton.className, /border-line/);

    rerender(
      <MockLessonScreen
        activeStep={getTutorialStep("whiteboard")}
        onStepAction={() => undefined}
      />,
    );

    await waitFor(() => {
      assert.ok(screen.getByRole("button", { name: "Ekran paylaş" }));
      assert.equal(screen.queryByText("Ekran paylaşılıyor"), null);
    });
  });

  it("completes the whiteboard exercise when opened and leaves the board visible", () => {
    const actions: string[] = [];
    render(
      <MockLessonScreen
        activeStep={getTutorialStep("whiteboard")}
        onStepAction={(id) => actions.push(id)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tahtayı aç/kapat" }));

    assert.ok(screen.getByText("Beyaz tahta açık"));
    assert.deepEqual(actions, ["whiteboard"]);
  });
});
