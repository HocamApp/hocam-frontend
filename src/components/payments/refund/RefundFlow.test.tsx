import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { calculation, paidPurchase, preview, refundRequest } from "@/test/refundFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

type Json = Record<string, unknown>;

const replaced: string[] = [];
const toasts: string[] = [];
const previewCalls: Json[] = [];
const requestCalls: Json[] = [];

let listResponse: () => unknown = () => ({ data: [] });
let previewHandler: (body: Json) => unknown = () => ({ data: preview() });
let requestHandler: (body: Json) => unknown = () => ({ data: refundRequest() });

function failure(status: number, data: unknown) {
  return Promise.reject({ isAxiosError: true, response: { status, data } });
}

let RefundFlow: typeof import("./RefundFlow").RefundFlow;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => replaced.push(href),
        replace: (href: string) => replaced.push(href),
        back: () => {},
      }),
      usePathname: () => "/profile/payments/refunds/new",
      useSearchParams: () => new URLSearchParams(),
    },
  });
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("sonner", {
    namedExports: { toast: { success: (message: string) => toasts.push(message) } },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/payments/refund-requests/") return listResponse();
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: Json) => {
        if (url === "/payments/refund-preview/") {
          previewCalls.push(body);
          return previewHandler(body);
        }
        if (url === "/payments/refund-requests/") {
          requestCalls.push(body);
          return requestHandler(body);
        }
        throw new Error(`unexpected POST ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ RefundFlow } = await import("./RefundFlow"));
});

beforeEach(() => {
  replaced.length = 0;
  toasts.length = 0;
  previewCalls.length = 0;
  requestCalls.length = 0;
  listResponse = () => ({ data: [] });
  previewHandler = () => ({ data: preview() });
  requestHandler = () => ({ data: refundRequest() });
});

afterEach(() => cleanup());

function renderFlow(props: { initialReason?: string | null } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <RefundFlow purchase={paidPurchase()} {...props} />
    </QueryClientProvider>
  );
}

async function untilReasonStep() {
  await waitFor(() => screen.getByRole("radio", { name: /Paketten vazgeçtim/ }));
}

async function toPreview(reasonLabel?: RegExp) {
  await untilReasonStep();
  if (reasonLabel) fireEvent.click(screen.getByRole("radio", { name: reasonLabel }));
  fireEvent.click(screen.getByRole("button", { name: "Devam et" }));
  await waitFor(() => screen.getByRole("heading", { name: "İade önizlemesi" }));
}

const text = () => document.body.textContent ?? "";

describe("the reason step", () => {
  it("offers the four everyday reasons and starts on the first", async () => {
    renderFlow();
    await untilReasonStep();

    const radios = screen.getAllByRole("radio");
    assert.equal(radios.length, 4);
    assert.equal((radios[0] as HTMLInputElement).checked, true);
    assert.equal(screen.queryByRole("radio", { name: /Seçtiğim saatler doldu/ }), null);
    assert.ok(screen.getByText("Ada Lovelace"));
    assert.ok(screen.getByText("8.500 ₺"));
  });

  it("offers the taken-hours reason, already chosen, when the link brings it", async () => {
    renderFlow({ initialReason: "slot_conflict" });
    await waitFor(() => screen.getByRole("radio", { name: /Seçtiğim saatler doldu/ }));

    const chosen = screen.getByRole("radio", { name: /Seçtiğim saatler doldu/ }) as HTMLInputElement;
    assert.equal(chosen.checked, true);
    assert.equal(screen.getAllByRole("radio").length, 5);
  });

  it("ignores a reason in the link that it does not offer", async () => {
    renderFlow({ initialReason: "tutor_left" });
    await untilReasonStep();
    assert.equal(
      (screen.getByRole("radio", { name: /Paketten vazgeçtim/ }) as HTMLInputElement).checked,
      true
    );
  });

  it("counts the note against its limit", async () => {
    renderFlow();
    await untilReasonStep();
    fireEvent.change(screen.getByLabelText(/Eklemek istediğin bir not var mı/), {
      target: { value: "Merhaba" },
    });
    assert.match(text(), /7\/2000/);
  });
});

describe("the preview step", () => {
  it("asks for a preview with the chosen reason and shows the figures and the lessons", async () => {
    renderFlow();
    await toPreview(/Hocayla ilgili bir sorun var/);

    assert.deepEqual(previewCalls, [{ purchase: "purchase-1", reason: "tutor_issue" }]);
    assert.ok(screen.getByText("6.800 ₺"));
    assert.ok(screen.getByText("− 1.700 ₺"));
    assert.ok(screen.getByText("2 ders × 850 ₺"));
    // 15:00 UTC is 18:00 in Istanbul, and 8 October 2026 is a Thursday.
    assert.ok(screen.getByText("8 Ekim Perşembe 18:00"));
    assert.ok(screen.getByText("14 Ekim Çarşamba 18:00"));
    assert.match(text(), /Takvime yerleştirilmemiş 4 ders hakkın iade kapsamında/);
    assert.match(text(), /Talebi göndermen hiçbir dersi iptal etmez/);
    assert.match(text(), /Bu önizleme 15 dakika geçerli/);
  });

  it("moves focus to the new step so a keyboard or screen reader user follows it", async () => {
    renderFlow();
    await toPreview();
    const heading = screen.getByRole("heading", { name: "İade önizlemesi" });
    await waitFor(() => assert.equal(document.activeElement, heading));
  });

  it("says a whole refund is whole, and shows no deduction", async () => {
    previewHandler = () => ({
      data: preview({
        calculation: calculation({
          full_refund: true,
          used_credits: 0,
          deduction_amount: 0,
          refund_amount: 8500,
          used_lessons: [],
        }),
      }),
    });
    renderFlow();
    await toPreview();

    assert.match(text(), /ödediğin tutarın tamamı iade edilir/);
    assert.equal(screen.queryByText("Kullanılmış dersler"), null);
    assert.equal(screen.queryByText(/Kullanılmış sayılacak dersler/), null);
  });

  it("keeps the reason and the note when the student goes back", async () => {
    renderFlow();
    await untilReasonStep();
    fireEvent.click(screen.getByRole("radio", { name: /Teknik bir sorun yaşadım/ }));
    fireEvent.change(screen.getByLabelText(/Eklemek istediğin bir not var mı/), {
      target: { value: "Oda açılmadı." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Devam et" }));
    await waitFor(() => screen.getByRole("heading", { name: "İade önizlemesi" }));

    fireEvent.click(screen.getByRole("button", { name: "Geri dön" }));

    await untilReasonStep();
    assert.equal(
      (screen.getByRole("radio", { name: /Teknik bir sorun yaşadım/ }) as HTMLInputElement).checked,
      true
    );
    assert.equal(
      (screen.getByLabelText(/Eklemek istediğin bir not var mı/) as HTMLTextAreaElement).value,
      "Oda açılmadı."
    );
  });

  it("explains a package that cannot be refunded and offers no way to send", async () => {
    previewHandler = () => ({
      data: preview({ eligible: false, blocked_reason: "nothing_to_refund", token: undefined }),
    });
    renderFlow();
    await toPreview();

    assert.match(text(), /iade edilecek tutar kalmadı/);
    assert.equal(screen.queryByRole("button", { name: "İade talebini gönder" }), null);
    assert.equal(
      screen.getByRole("link", { name: "Paketlerime dön" }).getAttribute("href"),
      "/profile/payments"
    );
  });

  it("lets the student pick another reason when this one does not apply", async () => {
    previewHandler = () => ({
      data: preview({ eligible: false, blocked_reason: "reason_not_applicable", token: undefined }),
    });
    renderFlow({ initialReason: "slot_conflict" });
    await waitFor(() => screen.getByRole("radio", { name: /Seçtiğim saatler doldu/ }));
    fireEvent.click(screen.getByRole("button", { name: "Devam et" }));
    await waitFor(() => screen.getByRole("heading", { name: "İade önizlemesi" }));

    fireEvent.click(screen.getByRole("button", { name: "Geri dön" }));
    await waitFor(() => screen.getByRole("radio", { name: /Paketten vazgeçtim/ }));
  });

  it("tells the student when the preview itself could not be worked out", async () => {
    previewHandler = () => failure(429, { detail: "Throttled" });
    renderFlow();
    await untilReasonStep();
    fireEvent.click(screen.getByRole("button", { name: "Devam et" }));

    await waitFor(() => screen.getByText(/Kısa sürede çok fazla deneme yaptın/));
    assert.equal(screen.queryByRole("heading", { name: "İade önizlemesi" }), null);
  });
});

describe("confirming", () => {
  it("sends the token the preview carried, with the note, and goes to the request", async () => {
    renderFlow();
    await untilReasonStep();
    fireEvent.change(screen.getByLabelText(/Eklemek istediğin bir not var mı/), {
      target: { value: "  Başka hocayla devam edeceğim.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Devam et" }));
    await waitFor(() => screen.getByRole("heading", { name: "İade önizlemesi" }));

    fireEvent.click(screen.getByRole("button", { name: "İade talebini gönder" }));

    await waitFor(() => assert.deepEqual(replaced, ["/profile/payments/refunds/refund-1"]));
    assert.deepEqual(requestCalls, [
      {
        purchase: "purchase-1",
        reason: "voluntary",
        preview_token: "token-1",
        note: "Başka hocayla devam edeceğim.",
      },
    ]);
    assert.deepEqual(toasts, ["İade talebin alındı."]);
  });

  it("sends one request however fast the button is pressed", async () => {
    renderFlow();
    await toPreview();

    const send = screen.getByRole("button", { name: "İade talebini gönder" });
    fireEvent.click(send);
    fireEvent.click(send);
    fireEvent.click(send);

    await waitFor(() => assert.equal(replaced.length, 1));
    assert.equal(requestCalls.length, 1);
  });

  it("shows the new figures when they moved, and asks again before sending anything", async () => {
    let attempts = 0;
    requestHandler = () => {
      attempts += 1;
      if (attempts === 1) {
        return failure(409, {
          code: "refund_preview_changed",
          detail: "x",
          preview: preview({
            token: "token-2",
            calculation: calculation({
              used_credits: 3,
              deduction_amount: 2550,
              refund_amount: 5950,
            }),
          }),
        });
      }
      return { data: refundRequest({ refund_amount: 5950 }) };
    };
    renderFlow();
    await toPreview();

    fireEvent.click(screen.getByRole("button", { name: "İade talebini gönder" }));

    await waitFor(() => screen.getByText(/İade tutarın değişti\. Yukarıdaki yeni tutarı/));
    // The student was looking at the button; focus goes to the sentence that
    // says the figures changed, so it is seen and read out.
    await waitFor(() =>
      assert.equal(
        document.activeElement,
        screen.getByText(/İade tutarın değişti\. Yukarıdaki yeni tutarı/)
      )
    );
    assert.ok(screen.getByText("5.950 ₺"));
    assert.equal(screen.queryByText("6.800 ₺"), null);
    assert.deepEqual(replaced, []);
    assert.equal(requestCalls.length, 1);

    fireEvent.click(screen.getByRole("button", { name: "İade talebini gönder" }));

    await waitFor(() => assert.equal(replaced.length, 1));
    assert.equal(requestCalls.length, 2);
    assert.equal(requestCalls[1].preview_token, "token-2");
  });

  it("refreshes an expired preview and asks again, without sending", async () => {
    let attempts = 0;
    requestHandler = () => {
      attempts += 1;
      return failure(400, { code: "preview_token_required", detail: "x" });
    };
    renderFlow();
    await toPreview();

    fireEvent.click(screen.getByRole("button", { name: "İade talebini gönder" }));

    await waitFor(() => assert.equal(previewCalls.length, 2));
    await waitFor(() => screen.getByText(/Önizlemenin süresi doldu/));
    assert.equal(attempts, 1);
    assert.deepEqual(replaced, []);
  });

  it("does not claim a lost answer failed, and lets the student try again", async () => {
    requestHandler = () => Promise.reject(new Error("Network Error"));
    renderFlow();
    await toPreview();

    fireEvent.click(screen.getByRole("button", { name: "İade talebini gönder" }));

    await waitFor(() => screen.getByText(/Yeniden göndermeden önce Ödemeler sayfasında/));
    assert.deepEqual(replaced, []);
    const again = screen.getByRole("button", { name: "İade talebini gönder" }) as HTMLButtonElement;
    assert.equal(again.disabled, false);
  });

  it("shows nothing the server wrote itself", async () => {
    requestHandler = () =>
      failure(409, { code: "something_new", detail: "INTERNAL STAFF TEXT" });
    renderFlow();
    await toPreview();

    fireEvent.click(screen.getByRole("button", { name: "İade talebini gönder" }));

    await waitFor(() => screen.getByText(/gönderilip gönderilmediğini doğrulayamadık/));
    assert.doesNotMatch(text(), /INTERNAL STAFF TEXT/);
  });
});

describe("a request that is already open", () => {
  it("points to it instead of starting another", async () => {
    listResponse = () => ({
      data: [refundRequest({ id: "open-1", purchase: "purchase-1", status: "approved" })],
    });
    renderFlow();

    await waitFor(() => screen.getByText("Bu paket için açık bir iade talebin var"));
    assert.equal(
      screen.getByRole("link", { name: "Talebini gör" }).getAttribute("href"),
      "/profile/payments/refunds/open-1"
    );
    assert.equal(screen.queryAllByRole("radio").length, 0);
  });

  it("is not stopped by a request that is over, or by another package's", async () => {
    listResponse = () => ({
      data: [
        refundRequest({ id: "old", purchase: "purchase-1", status: "rejected" }),
        refundRequest({ id: "other", purchase: "purchase-2", status: "requested" }),
      ],
    });
    renderFlow();
    await untilReasonStep();
  });

  it("learns of one the list had not shown yet when the server says so", async () => {
    previewHandler = () => ({
      data: preview({ eligible: false, blocked_reason: "refund_in_progress", token: undefined }),
    });
    // The list the screen read on arrival is empty; the request was opened in
    // another tab since, so the next read has it.
    let reads = 0;
    listResponse = () => {
      reads += 1;
      return {
        data:
          reads === 1
            ? []
            : [refundRequest({ id: "open-2", purchase: "purchase-1", status: "requested" })],
      };
    };
    renderFlow();
    await untilReasonStep();
    fireEvent.click(screen.getByRole("button", { name: "Devam et" }));

    // The preview says a request is open; the screen asks for the list again
    // and, once it has it, points to the request instead of the preview.
    await waitFor(() =>
      assert.equal(
        screen.getByRole("link", { name: "Talebini gör" }).getAttribute("href"),
        "/profile/payments/refunds/open-2"
      )
    );
  });
});
