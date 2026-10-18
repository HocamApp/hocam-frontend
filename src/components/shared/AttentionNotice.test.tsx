import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { AttentionNotice } from "@/components/shared/AttentionNotice";

afterEach(cleanup);

test("a titled notice with a body and one way forward", () => {
  render(
    <AttentionNotice title="Rapor gecikti" action={<a href="/destek">Desteğe başvur</a>}>
      <p>Son teslim: dün</p>
    </AttentionNotice>,
  );
  const notice = screen.getByRole("status");
  assert.ok(notice.textContent?.includes("Rapor gecikti"));
  assert.ok(notice.textContent?.includes("Son teslim: dün"));
  assert.equal(notice.querySelector("a")?.getAttribute("href"), "/destek");
  assert.equal(notice.querySelector("svg")?.getAttribute("aria-hidden"), "true");
});

test("body and action are optional, and the role can be raised to alert", () => {
  render(<AttentionNotice title="Süre doldu" role="alert" />);
  const notice = screen.getByRole("alert");
  assert.equal(notice.querySelectorAll("p").length, 1);
});

test("it is a pink hairline on the surface colour with a pink icon and ink text: no stripe, no tint, no warning hue", () => {
  render(<AttentionNotice title="x" />);
  const className = screen.getByRole("status").className;
  assert.match(className, /border-pink/);
  assert.match(className, /text-ink/);
  assert.match(screen.getByRole("status").querySelector("svg")?.getAttribute("class") ?? "", /text-pink/);
  assert.match(className, /bg-surface/);
  assert.match(className, /rounded-input/);
  assert.doesNotMatch(className, /border-l|gold|amber|yellow|bg-paper|bg-pink|error/);
});
