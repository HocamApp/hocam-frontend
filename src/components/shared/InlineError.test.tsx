import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { InlineError } from "./InlineError";
import { ErrorMessage } from "./ErrorMessage";

after(() => window.close());
afterEach(cleanup);

describe("InlineError", () => {
  it("renders nothing without a message, so callers can pass state directly", () => {
    const { container } = render(<InlineError message={null} />);
    assert.equal(container.textContent, "");
    cleanup();
    assert.equal(render(<InlineError message="" />).container.textContent, "");
  });

  it("announces the failure with an icon beside the text", () => {
    render(<InlineError message="Görüntü ayarı uygulanamadı. Lütfen tekrar dene." />);
    const alert = screen.getByRole("alert");
    assert.match(alert.textContent ?? "", /Görüntü ayarı uygulanamadı/);
    // Colour is never the only signal (DESIGN.md): an icon ships with it.
    assert.ok(alert.querySelector("svg"), "the circled exclamation must render");
    assert.match(alert.className, /text-error/);
  });

  it("keeps the title with the message on page-level failures", () => {
    render(<InlineError title="Ders yüklenemedi" message="Bağlantını kontrol et." />);
    const alert = screen.getByRole("alert");
    assert.match(alert.textContent ?? "", /Ders yüklenemedi/);
    assert.match(alert.textContent ?? "", /Bağlantını kontrol et\./);
  });

  it("replays for a new message", () => {
    // The animation is keyed on the text: a second, differently worded
    // failure must not sit there looking like the first one.
    const view = render(<InlineError message="Birinci hata." />);
    const first = screen.getByRole("alert").querySelectorAll("span")[1];
    view.rerender(<InlineError message="İkinci hata." />);
    const second = screen.getByRole("alert").querySelectorAll("span")[1];
    assert.notEqual(first, second, "the text node is re-created so the motion runs again");
  });

  it("is what the shared ErrorMessage renders", () => {
    render(<ErrorMessage message="Bir şeyler ters gitti." />);
    const alert = screen.getByRole("alert");
    assert.ok(alert.querySelector("svg"));
    assert.match(alert.className, /text-error/);
  });
});
