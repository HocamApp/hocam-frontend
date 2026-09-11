import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React, { createRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { OtpInput, type OtpInputHandle } from "./otp-input";
import { PasswordStrength } from "./password-strength";

afterEach(cleanup);

describe("OtpInput", () => {
  it("yapıştırılan 6 rakamı kutulara dağıtır ve bir kez tamamlar", () => {
    const completed: string[] = [];
    render(<OtpInput onComplete={(value) => completed.push(value)} />);
    const first = screen.getByLabelText("Doğrulama kodu, 1/6");

    fireEvent.paste(first, {
      clipboardData: { getData: () => "204815" },
    });

    assert.deepEqual(completed, ["204815"]);
    assert.equal((screen.getByLabelText("Doğrulama kodu, 6/6") as HTMLInputElement).value, "5");
  });

  it("yanlış ve doğru durumlarını Türkçe canlı mesajla bildirir", () => {
    const { rerender } = render(
      <OtpInput status="error" errorMessage="Kod yanlış." />
    );
    assert.equal(screen.getByRole("status").textContent, "Kod yanlış.");
    assert.equal(screen.getByRole("group").getAttribute("data-status"), "error");

    rerender(<OtpInput status="success" successMessage="Kod doğrulandı." />);
    assert.equal(screen.getByRole("status").textContent, "Kod doğrulandı.");
    assert.equal(screen.getByRole("group").getAttribute("data-status"), "success");
  });

  it("React 18 ref üzerinden temizlenip yeniden odaklanabilir", () => {
    const ref = createRef<OtpInputHandle>();
    render(<OtpInput ref={ref} defaultValue="123456" />);
    act(() => ref.current?.clear());
    assert.equal((screen.getByLabelText("Doğrulama kodu, 1/6") as HTMLInputElement).value, "");
    assert.equal(document.activeElement, screen.getByLabelText("Doğrulama kodu, 1/6"));
  });
});

describe("PasswordStrength", () => {
  it("üç Türkçe kuralı ve eşleşme durumunu gösterir", () => {
    render(<PasswordStrength value="Güvenli9" />);
    screen.getByText("En az 8 karakter");
    screen.getByText("Bir büyük ve bir küçük harf");
    screen.getByText("Bir sayı veya sembol");
    assert.equal(screen.getByRole("meter").getAttribute("aria-valuenow"), "3");
  });
});
