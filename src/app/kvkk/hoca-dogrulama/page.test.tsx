import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import TutorVerificationNoticePage from "./page";

afterEach(() => cleanup());

describe("Hoca doğrulama aydınlatma metni", () => {
  it("covers data, legal basis, recipients, retention and rights", () => {
    render(<TutorVerificationNoticePage />);

    for (const heading of [
      "Hangi veriler işlenir?",
      "Amaç, yöntem ve hukuki sebep",
      "Kimlere aktarılır?",
      "Ne kadar saklanır?",
      "Hakların",
    ]) {
      assert.ok(screen.getByRole("heading", { name: heading }));
    }
    assert.ok(screen.getByText(/onaydan sonra 7 gün/));
    assert.ok(screen.getByText(/üst sınırı 30 gündür/));
    assert.ok(screen.getByText(/Railway/));
    assert.ok(screen.getByText(/Supabase/));
    assert.ok(screen.getByText(/Resend/));
    assert.ok(screen.getByText(/m\.5\/2-c/));
    assert.ok(screen.getByText(/m\.5\/2-f/));
  });

  it("links to the general notice and the data-subject request channel", () => {
    render(<TutorVerificationNoticePage />);

    assert.equal(
      screen.getByRole("link", { name: "genel aydınlatma metninde" }).getAttribute("href"),
      "/kvkk/aydinlatma-metni"
    );
    assert.equal(
      screen.getByRole("link", { name: "Gizlilik ve Verilerim" }).getAttribute("href"),
      "/profile/gizlilik"
    );
  });
});
