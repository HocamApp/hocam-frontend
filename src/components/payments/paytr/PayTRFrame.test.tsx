import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { PayTRFrame } from "./PayTRFrame";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

afterEach(() => cleanup());

const VALID = "https://www.paytr.com/odeme/guvenli/abc123token";

describe("PayTRFrame", () => {
  it("embeds the hosted form once, with a title a screen reader can use", () => {
    const { container } = render(<PayTRFrame iframeUrl={VALID} />);
    const frames = container.querySelectorAll("iframe");

    assert.equal(frames.length, 1);
    assert.equal(frames[0].getAttribute("src"), VALID);
    assert.equal(frames[0].getAttribute("title"), "PayTR güvenli ödeme");
  });

  it("renders no frame at all for an address it cannot verify", () => {
    const { container } = render(
      <PayTRFrame iframeUrl="https://paytr.example/odeme/guvenli/abc" />
    );

    assert.equal(container.querySelectorAll("iframe").length, 0);
    assert.ok(screen.getByText("Ödeme ekranı güvenli şekilde açılamadı."));
  });

  it("puts no HOCAM control over the bank's own form", () => {
    const { container } = render(<PayTRFrame iframeUrl={VALID} />);

    assert.equal(container.querySelectorAll("button, input").length, 0);
  });

  it("adds no sandbox rules nobody has tested against 3D Secure", () => {
    const { container } = render(<PayTRFrame iframeUrl={VALID} />);

    assert.equal(container.querySelector("iframe")?.hasAttribute("sandbox"), false);
  });
});
