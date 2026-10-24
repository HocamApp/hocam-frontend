import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const posted: { url: string; body: Record<string, unknown> }[] = [];
let getResult: { data?: unknown; status?: number } = {};
let postFails = false;
let C: typeof import("./SessionExperienceFeedback");

before(async () => {
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {}, info() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async () => {
        if (getResult.status) {
          throw Object.assign(new Error(`http ${getResult.status}`), { response: { status: getResult.status, data: {} } });
        }
        return { data: getResult.data };
      },
      post: async (url: string, body: Record<string, unknown>) => {
        posted.push({ url, body });
        if (postFails) throw Object.assign(new Error("http 500"), { response: { status: 500, data: {} } });
        return { data: { id: "f-1", rating: body.rating } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  C = await import("./SessionExperienceFeedback");
});

after(() => window.close());
beforeEach(() => {
  posted.length = 0;
  postFails = false;
  getResult = {
    data: { ask: true, answered: false, reasons: ["video_audio", "connection", "files", "report_program", "other"] },
  };
  try {
    window.localStorage.clear();
  } catch {
    /* no storage in this environment */
  }
});
afterEach(cleanup);

function renderStrip() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <C.SessionExperienceFeedback sessionId="s-1" />
    </QueryClientProvider>,
  );
}

const title = "Bu görüşmede sistem nasıldı?";

describe("SessionExperienceFeedback", () => {
  it("asks with three plain boxes when the server says ask", async () => {
    renderStrip();

    assert.ok(await screen.findByText(title));
    for (const name of ["Kötü", "İdare eder", "İyi"]) {
      const box = screen.getByRole("button", { name });
      assert.equal(box.getAttribute("aria-pressed"), "false");
    }
  });

  it("draws nothing when the server does not ask", async () => {
    getResult = { data: { ask: false, answered: false } };
    const { container } = renderStrip();

    await waitFor(() => assert.equal(screen.queryByText(title), null));
    assert.equal(container.textContent, "");
  });

  it("draws nothing when it was already answered", async () => {
    getResult = { data: { ask: false, answered: true, reasons: [] } };
    const { container } = renderStrip();

    await waitFor(() => assert.equal(container.textContent, ""));
  });

  it("draws nothing, and no error, on a 404 (flag off or backend not deployed yet) and on a 403", async () => {
    for (const status of [404, 403]) {
      cleanup();
      getResult = { status };
      const { container } = renderStrip();
      await new Promise((resolve) => setTimeout(resolve, 30));
      assert.equal(container.textContent, "", `status ${status}`);
    }
  });

  it("sends İyi at once, with no reason and no note, and thanks", async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole("button", { name: "İyi" }));

    await waitFor(() => assert.equal(posted.length, 1));
    assert.equal(posted[0].url, "/coaching/sessions/s-1/experience-feedback/");
    assert.deepEqual(posted[0].body, { rating: "good", reasons: [], comment: "" });
    assert.ok(await screen.findByText("Teşekkürler, cevabın alındı."));
    assert.equal(screen.queryByText(title), null);
  });

  it("opens the reasons for Kötü and İdare eder, sends nothing until Gönder", async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole("button", { name: "Kötü" }));

    assert.equal(screen.getByRole("button", { name: "Kötü" }).getAttribute("aria-pressed"), "true");
    assert.ok(screen.getByText("Neyi düzeltelim?"));
    for (const label of ["Görüntü / ses", "Bağlantı", "Dosyalar", "Rapor / program", "Diğer"]) {
      assert.ok(screen.getByRole("button", { name: label }), label);
    }
    assert.equal(posted.length, 0);

    fireEvent.click(screen.getByRole("button", { name: "İdare eder" }));
    assert.equal(screen.getByRole("button", { name: "İdare eder" }).getAttribute("aria-pressed"), "true");
    assert.equal(screen.getByRole("button", { name: "Kötü" }).getAttribute("aria-pressed"), "false");
    assert.equal(posted.length, 0);
  });

  it("sends the chosen rating, the picked reasons and the trimmed note on Gönder", async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole("button", { name: "Kötü" }));
    fireEvent.click(screen.getByRole("button", { name: "Görüntü / ses" }));
    fireEvent.click(screen.getByRole("button", { name: "Dosyalar" }));
    fireEvent.change(screen.getByLabelText("İstersen kısaca yaz"), { target: { value: "  Ses kesildi  " } });
    fireEvent.click(screen.getByRole("button", { name: "Gönder" }));

    await waitFor(() => assert.equal(posted.length, 1));
    assert.deepEqual(posted[0].body, {
      rating: "bad",
      reasons: ["video_audio", "files"],
      comment: "Ses kesildi",
    });
    assert.ok(await screen.findByText("Teşekkürler, cevabın alındı."));
  });

  it("lets a picked reason be taken back", async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole("button", { name: "Kötü" }));
    const reason = screen.getByRole("button", { name: "Bağlantı" });
    fireEvent.click(reason);
    assert.equal(reason.getAttribute("aria-pressed"), "true");
    fireEvent.click(reason);
    assert.equal(reason.getAttribute("aria-pressed"), "false");
    fireEvent.click(screen.getByRole("button", { name: "Gönder" }));

    await waitFor(() => assert.equal(posted.length, 1));
    assert.deepEqual(posted[0].body.reasons, []);
  });

  it("shows only the reasons the server gave for this role", async () => {
    getResult = {
      data: { ask: true, answered: false, reasons: ["video_audio", "connection", "files", "report_form", "other"] },
    };
    renderStrip();
    fireEvent.click(await screen.findByRole("button", { name: "Kötü" }));

    assert.ok(screen.getByRole("button", { name: "Rapor formu" }));
    assert.equal(screen.queryByRole("button", { name: "Rapor / program" }), null);
  });

  it("caps the note at 500 characters and tells the person not to write personal details", async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole("button", { name: "Kötü" }));

    const note = screen.getByLabelText("İstersen kısaca yaz") as HTMLTextAreaElement;
    assert.equal(note.maxLength, 500);
    assert.ok(screen.getByText(/kişisel bilgi/i));
  });

  it("keeps the answer on screen and lets the person try again when sending fails", async () => {
    postFails = true;
    renderStrip();
    fireEvent.click(await screen.findByRole("button", { name: "Kötü" }));
    fireEvent.click(screen.getByRole("button", { name: "Gönder" }));

    await waitFor(() => assert.equal(posted.length, 1));
    await waitFor(() => assert.ok(screen.getByRole("button", { name: "Gönder" })));
    assert.equal(screen.queryByText("Teşekkürler, cevabın alındı."), null);
    assert.equal(screen.getByRole("button", { name: "Kötü" }).getAttribute("aria-pressed"), "true");
  });

  it("closes with the cross for this meeting and stays closed on a return", async () => {
    const first = renderStrip();
    await screen.findByText(title);
    fireEvent.click(screen.getByRole("button", { name: "Kapat" }));
    assert.equal(screen.queryByText(title), null);
    assert.equal(posted.length, 0);

    first.unmount();
    const { container } = renderStrip();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(container.textContent, "");
  });

  it("has the 44px touch targets and 16px note text the rules ask for", async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole("button", { name: "Kötü" }));

    for (const name of ["Kötü", "İdare eder", "İyi", "Görüntü / ses", "Gönder", "Kapat"]) {
      assert.match(screen.getByRole("button", { name }).className, /min-h-11/, name);
    }
    const note = screen.getByLabelText("İstersen kısaca yaz");
    assert.doesNotMatch(note.className, /text-(xs|sm)\b|text-\[1[0-5]px\]/);
  });
});
