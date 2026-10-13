import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React, { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PolicyConsent, POLICY_CONSENT_ERROR } from "./PolicyConsent";
import type { PolicyCopy } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const policy: PolicyCopy = {
  version: "p-abc123",
  status: "draft",
  acceptance_required: false,
  sections: [
    { id: "payment", title: "Ödeme", body: "Ödemeye geçtiğinde paketin tutarını ödemekle yükümlü olursun." },
    { id: "hold", title: "Saatlerin ayrılır", body: "Seçtiğin saatler 40 dakika boyunca yalnızca senin için ayrılır." },
  ],
  consent_label: "Ön bilgilendirme koşullarını okudum ve kabul ediyorum.",
  pay_button_label: "Ödeme yükümlülüğü ile devam et",
  links: [
    { label: "Mesafeli satış sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
    { label: "İptal ve iade koşulları", href: "/iptal-ve-iade" },
  ],
};

afterEach(() => cleanup());

function renderConsent(overrides: Partial<React.ComponentProps<typeof PolicyConsent>> = {}) {
  const changes: boolean[] = [];
  const checkboxRef = createRef<HTMLInputElement>();
  render(
    <PolicyConsent
      policy={policy}
      accepted={false}
      onAcceptedChange={(value) => changes.push(value)}
      showError={false}
      checkboxRef={checkboxRef}
      {...overrides}
    />
  );
  return { changes, checkboxRef };
}

test("the box is never pre-ticked and carries the backend's wording", () => {
  renderConsent();

  const box = screen.getByRole("checkbox", { name: policy.consent_label }) as HTMLInputElement;
  assert.equal(box.checked, false);
  assert.equal(box.disabled, false);
});

test("ticking and unticking report the new value", () => {
  const { changes } = renderConsent();

  fireEvent.click(screen.getByRole("checkbox"));

  assert.deepEqual(changes, [true]);
});

test("the legal pages are links that open on their own, so the checkout stays where it is", () => {
  renderConsent();

  for (const link of policy.links) {
    const anchor = screen.getByRole("link", { name: link.label });
    assert.equal(anchor.getAttribute("href"), link.href);
    assert.equal(anchor.getAttribute("target"), "_blank");
    assert.match(anchor.getAttribute("rel") ?? "", /noopener/);
  }
});

test("the summary is one press away and says what the backend said", () => {
  renderConsent();
  assert.equal(screen.queryByText("Saatlerin ayrılır"), null);

  fireEvent.click(screen.getByRole("button", { name: "Özeti göster" }));

  assert.ok(screen.getByText("Saatlerin ayrılır"));
  assert.ok(screen.getByText(policy.sections[0].body));
  assert.equal(screen.getByRole("button", { name: "Özeti gizle" }).getAttribute("aria-expanded"), "true");
});

test("pressing pay without the box shows the standard error and ties it to the box", () => {
  renderConsent({ showError: true });

  const box = screen.getByRole("checkbox");
  const error = screen.getByRole("alert");
  assert.equal(error.textContent, POLICY_CONSENT_ERROR);
  assert.equal(box.getAttribute("aria-invalid"), "true");
  assert.equal(box.getAttribute("aria-describedby"), "policy-consent-error");
  assert.equal(error.id, "policy-consent-error");
});

test("no error is shown until it is asked for", () => {
  renderConsent();
  assert.equal(screen.queryByRole("alert"), null);
  assert.equal(screen.getByRole("checkbox").getAttribute("aria-invalid"), null);
});

test("the page can move focus to the box", () => {
  const { checkboxRef } = renderConsent({ showError: true });

  checkboxRef.current?.focus();

  assert.equal(document.activeElement, screen.getByRole("checkbox"));
});
