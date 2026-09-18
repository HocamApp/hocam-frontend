import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

import type { StartPayTRCheckoutRequest } from "@/types";

const CUSTOMER: StartPayTRCheckoutRequest = {
  user_name: "Ada Yılmaz",
  user_address: "Bağdat Caddesi 1, Kadıköy, İstanbul",
  user_phone: "+905551112233",
};

function axiosError(status: number, data: unknown) {
  return { isAxiosError: true, response: { status, data } };
}

afterEach(() => {
  mock.reset();
});

describe("startPayTRCheckout", () => {
  it("posts the customer fields to the purchase-scoped payments path", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    mock.module("./api", {
      defaultExport: {
        post: async (url: string, body: unknown) => {
          calls.push({ url, body });
          return {
            data: {
              merchant_oid: "HOCAM123",
              iframe_url: "https://www.paytr.com/odeme/guvenli/tok",
            },
          };
        },
      },
    });

    const { startPayTRCheckout } = await import("./paymentsApi");
    const result = await startPayTRCheckout("purchase-1", CUSTOMER);

    // Exactly these three keys: the amount, e-mail and IP are the server's
    // to derive, and a deepEqual here fails the moment one of them leaks in.
    assert.deepEqual(calls, [
      {
        url: "/payments/package-purchases/purchase-1/paytr-checkout/",
        body: CUSTOMER,
      },
    ]);
    assert.deepEqual(result, {
      merchant_oid: "HOCAM123",
      iframe_url: "https://www.paytr.com/odeme/guvenli/tok",
    });
  });
});

describe("describePayTRCheckoutError", () => {
  it("maps the missing-field 400 onto the fields the form owns", async () => {
    const { describePayTRCheckoutError } = await import("./paymentsApi");
    const described = describePayTRCheckoutError(
      axiosError(400, {
        user_name: "This field is required.",
        user_phone: ["This field is required."],
      })
    );

    assert.equal(described.kind, "field");
    assert.deepEqual(described.fieldErrors, {
      user_name: "Ad soyad gerekli.",
      user_phone: "Telefon numarası gerekli.",
    });
    assert.equal(
      described.message,
      "Ödeme başlatılamadı. Bilgilerini kontrol edip yeniden dene."
    );
  });

  it("keeps the customer-IP 400 as a general form error, not infrastructure detail", async () => {
    const { describePayTRCheckoutError } = await import("./paymentsApi");
    const described = describePayTRCheckoutError(
      axiosError(400, { detail: "A valid customer IP is required." })
    );

    assert.equal(described.kind, "form");
    assert.deepEqual(described.fieldErrors, {});
    assert.equal(
      described.message,
      "Ödeme başlatılamadı. Bilgilerini kontrol edip yeniden dene."
    );
  });

  it("reads 404 as an unavailable purchase", async () => {
    const { describePayTRCheckoutError } = await import("./paymentsApi");
    const described = describePayTRCheckoutError(
      axiosError(404, { detail: "Not found." })
    );

    assert.equal(described.kind, "unavailable");
    assert.equal(described.message, "Paket bilgilerine erişilemiyor.");
  });

  it("reads 409 as a stale local state that must be refetched", async () => {
    const { describePayTRCheckoutError } = await import("./paymentsApi");
    const notPayable = describePayTRCheckoutError(
      axiosError(409, { detail: "Purchase is not payable." })
    );
    const acceptanceMissing = describePayTRCheckoutError(
      axiosError(409, { detail: "Tutor acceptance is required before payment." })
    );

    assert.equal(notPayable.kind, "conflict");
    assert.equal(acceptanceMissing.kind, "conflict");
    assert.equal(notPayable.message, "Paketin güncel durumu kontrol ediliyor.");
  });

  it("never surfaces the raw provider exception behind a 503", async () => {
    const { describePayTRCheckoutError } = await import("./paymentsApi");
    const described = describePayTRCheckoutError(
      axiosError(503, {
        detail: "PAYTR_MERCHANT_SALT is missing at /app/config/settings.py",
      })
    );

    assert.equal(described.kind, "service");
    assert.equal(described.message, "Ödeme hizmeti şu anda kullanılamıyor.");
    assert.doesNotMatch(described.message, /SALT|settings/i);
  });

  it("treats a lost response as unknown, never as a confirmed failure", async () => {
    const { describePayTRCheckoutError } = await import("./paymentsApi");
    const network = describePayTRCheckoutError(new Error("Network Error"));
    const serverError = describePayTRCheckoutError(
      axiosError(500, { detail: "boom" })
    );

    assert.equal(network.kind, "unknown");
    assert.equal(serverError.kind, "unknown");
    assert.equal(
      network.message,
      "Ödeme sonucu doğrulanmadı. Yeniden ödeme başlatmadan durumu kontrol et."
    );
    assert.doesNotMatch(network.message, /çekilmedi|tekrar öde/i);
  });
});
