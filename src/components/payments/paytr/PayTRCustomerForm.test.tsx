import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

mock.module("next/link", {
  defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
});

// Imported after the next/link mock is registered; tsx compiles this file to
// CommonJS, which has no top-level await.
let PayTRCustomerForm: typeof import("./PayTRCustomerForm").PayTRCustomerForm;

before(async () => {
  ({ PayTRCustomerForm } = await import("./PayTRCustomerForm"));
});

afterEach(() => cleanup());

function fill(values: { name?: string; phone?: string; address?: string }) {
  if (values.name !== undefined) {
    fireEvent.change(screen.getByLabelText("Ad soyad"), {
      target: { value: values.name },
    });
  }
  if (values.phone !== undefined) {
    fireEvent.change(screen.getByLabelText("Telefon"), {
      target: { value: values.phone },
    });
  }
  if (values.address !== undefined) {
    fireEvent.change(screen.getByLabelText("Adres"), {
      target: { value: values.address },
    });
  }
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Güvenli ödemeye geç" }));
}

describe("PayTRCustomerForm", () => {
  it("labels every field and tells the browser what to autofill", () => {
    render(<PayTRCustomerForm onSubmit={async () => {}} />);

    assert.equal(screen.getByLabelText("Ad soyad").getAttribute("autocomplete"), "name");
    assert.equal(screen.getByLabelText("Telefon").getAttribute("autocomplete"), "tel");
    assert.equal(
      screen.getByLabelText("Adres").getAttribute("autocomplete"),
      "street-address"
    );
    assert.ok(screen.getByText("Tüm alanlar zorunludur."));
  });

  it("sends the trimmed, normalized values the API layer expects", async () => {
    const calls: unknown[] = [];
    render(<PayTRCustomerForm onSubmit={async (values) => { calls.push(values); }} />);

    fill({
      name: "  Ada Yılmaz ",
      phone: "0555 111 22 33",
      address: " Bağdat Caddesi 1, Kadıköy ",
    });
    submit();

    await waitFor(() => assert.equal(calls.length, 1));
    assert.deepEqual(calls[0], {
      user_name: "Ada Yılmaz",
      user_phone: "05551112233",
      user_address: "Bağdat Caddesi 1, Kadıköy",
    });
  });

  it("reports every empty field and moves focus to the first one", async () => {
    render(<PayTRCustomerForm onSubmit={async () => {}} />);

    submit();

    await waitFor(() => {
      assert.ok(screen.getByText("Ad soyad 2–60 karakter olmalı."));
    });
    assert.ok(screen.getByText("Geçerli bir telefon numarası gir."));
    assert.ok(screen.getByText("Adres 5–400 karakter olmalı."));
    assert.equal(document.activeElement, screen.getByLabelText("Ad soyad"));
  });

  it("wires each error to its field for a screen reader", async () => {
    render(<PayTRCustomerForm onSubmit={async () => {}} />);

    submit();

    await waitFor(() => {
      assert.equal(screen.getByLabelText("Telefon").getAttribute("aria-invalid"), "true");
    });
    const phone = screen.getByLabelText("Telefon");
    const describedBy = phone.getAttribute("aria-describedby");
    assert.ok(describedBy);
    const description = document.getElementById(describedBy!.split(" ")[0]);
    assert.match(description?.textContent ?? "", /telefon/i);
  });

  it("asks for a token once, however fast the button is clicked", async () => {
    const calls: unknown[] = [];
    render(
      <PayTRCustomerForm
        onSubmit={async (values) => {
          calls.push(values);
          await new Promise(() => {});
        }}
      />
    );

    fill({
      name: "Ada Yılmaz",
      phone: "05551112233",
      address: "Bağdat Caddesi 1, Kadıköy",
    });
    submit();
    submit();
    submit();

    await waitFor(() => assert.equal(calls.length, 1));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(calls.length, 1);
  });

  it("locks the form while the token request is in flight", () => {
    render(<PayTRCustomerForm onSubmit={async () => {}} isSubmitting />);

    const cta = screen.getByRole("button", { name: "Ödeme ekranı hazırlanıyor…" });
    assert.equal((cta as HTMLButtonElement).disabled, true);
    assert.equal(
      (screen.getByLabelText("Ad soyad") as HTMLInputElement).readOnly,
      true
    );
  });

  it("puts the legal links before the payment action, each opening safely", () => {
    render(<PayTRCustomerForm onSubmit={async () => {}} />);

    const links = [
      screen.getByRole("link", { name: /Kullanım koşulları/ }),
      screen.getByRole("link", { name: /Mesafeli satış sözleşmesi/ }),
      screen.getByRole("link", { name: /İptal ve iade/ }),
    ];
    const cta = screen.getByRole("button", { name: "Güvenli ödemeye geç" });

    assert.deepEqual(
      links.map((link) => link.getAttribute("href")),
      ["/kullanim-kosullari", "/mesafeli-satis-sozlesmesi", "/iptal-ve-iade"]
    );
    for (const link of links) {
      assert.equal(link.getAttribute("target"), "_blank");
      assert.equal(link.getAttribute("rel"), "noopener noreferrer");
      // DOCUMENT_POSITION_FOLLOWING: the CTA comes after the link.
      assert.ok(link.compareDocumentPosition(cta) & 4);
    }
  });

  it("records no contract acceptance the backend does not store", () => {
    render(<PayTRCustomerForm onSubmit={async () => {}} />);

    assert.equal(screen.queryAllByRole("checkbox").length, 0);
  });

  it("collects no card data of its own", () => {
    const { container } = render(<PayTRCustomerForm onSubmit={async () => {}} />);

    assert.equal(container.querySelectorAll("input, textarea").length, 3);
    assert.doesNotMatch(container.textContent ?? "", /kart numaras|cvv|son kullanma/i);
    assert.match(
      container.textContent ?? "",
      /Kart bilgilerini PayTR ödeme ekranında gireceksin\./
    );
  });

  it("shows the safe server messages the API layer mapped", () => {
    render(
      <PayTRCustomerForm
        onSubmit={async () => {}}
        fieldErrors={{ user_phone: "Telefon numarası gerekli." }}
        formError="Ödeme başlatılamadı. Bilgilerini kontrol edip yeniden dene."
      />
    );

    assert.ok(screen.getByText("Telefon numarası gerekli."));
    assert.ok(
      screen.getByText("Ödeme başlatılamadı. Bilgilerini kontrol edip yeniden dene.")
    );
  });
});
