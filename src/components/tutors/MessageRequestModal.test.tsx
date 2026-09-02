import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";

import type { TutorProfile } from "@/types";
import { MessageRequestModal } from "./MessageRequestModal";

class TestVisualViewport extends EventTarget {
  height = 568;
  width = 320;
  offsetTop = 0;
  offsetLeft = 0;
  pageTop = 0;
  pageLeft = 0;
  scale = 1;
  onresize = null;
  onscroll = null;
}

const visualViewport = new TestVisualViewport();

beforeEach(() => {
  visualViewport.height = 568;
  visualViewport.offsetTop = 0;
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: visualViewport,
  });
});

afterEach(() => cleanup());

test("message dialog follows the visual viewport when the mobile keyboard reduces its height", () => {
  render(
    <MessageRequestModal
      tutor={
        {
          id: "tutor-1",
          name: "Ayşe",
          surname: "Hoca",
          profile_picture: "",
        } as TutorProfile
      }
      isOpen
      onClose={() => {}}
      onSuccess={() => {}}
    />,
  );

  const dialog = screen.getByRole("dialog");
  assert.equal(dialog.style.maxHeight, "calc(568px - 1rem)");
  assert.equal(dialog.style.top, "284px");

  act(() => {
    visualViewport.height = 320;
    visualViewport.dispatchEvent(new Event("resize"));
  });

  assert.equal(dialog.style.maxHeight, "calc(320px - 1rem)");
  assert.equal(dialog.style.top, "160px");
});
