import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { MockChatPane } from "./MockChatPane";

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

describe("MockChatPane send guidance", () => {
  it("shows a textless reduced-motion-safe arrow after the student message", () => {
    render(
      <MockChatPane
        messages={[{ from: "student", text: "Hocam, beni duyuyor musunuz?" }]}
        studentTyping={false}
        onSendReply={() => undefined}
        replySent={false}
      />,
    );

    const hint = screen.getByTestId("tutorial-send-hint");
    assert.equal(hint.textContent, "");
    assert.equal(hint.getAttribute("aria-hidden"), "true");
    assert.doesNotMatch(hint.className, /rounded|border|bg-surface|shadow/);
    assert.match(hint.innerHTML, /animate-tutorial-send-hint/);
    assert.match(hint.innerHTML, /motion-reduce:animate-none/);
  });

  it("keeps the message list and composer inside a stable full-height panel", () => {
    render(
      <MockChatPane
        messages={[{ from: "student", text: "Hocam, beni duyuyor musunuz?" }]}
        studentTyping={false}
        onSendReply={() => undefined}
        replySent={false}
      />,
    );

    const pane = screen.getByRole("complementary", { name: /Ders sohbeti/ });
    assert.match(pane.className, /min-h-0/);
    assert.match(pane.className, /shadow/);
    assert.match(screen.getByTestId("tutorial-chat-messages").className, /min-h-0/);
    assert.match(screen.getByTestId("tutorial-chat-composer").className, /shrink-0/);
  });

  it("hides the arrow while the student is typing and after the reply is sent", () => {
    const { rerender } = render(
      <MockChatPane
        messages={[]}
        studentTyping
        onSendReply={() => undefined}
        replySent={false}
      />,
    );

    assert.equal(screen.queryByTestId("tutorial-send-hint"), null);

    rerender(
      <MockChatPane
        messages={[{ from: "student", text: "Hocam, beni duyuyor musunuz?" }]}
        studentTyping={false}
        onSendReply={() => undefined}
        replySent
      />,
    );

    assert.equal(screen.queryByTestId("tutorial-send-hint"), null);
  });
});
