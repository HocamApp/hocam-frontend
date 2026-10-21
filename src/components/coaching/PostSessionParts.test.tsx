import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const posted: { url: string; body: Record<string, unknown> }[] = [];
let postFails = false;
let P: typeof import("./PostSessionParts");
// Loaded after the mocks: a static import would pull in the real axios instance first.
let RATING_CRITERIA: (typeof import("@/lib/coachingApi"))["RATING_CRITERIA"];
let RATING_CRITERIA_LABELS: (typeof import("@/lib/coachingApi"))["RATING_CRITERIA_LABELS"];

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {}, info() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      post: async (url: string, body: Record<string, unknown>) => {
        posted.push({ url, body });
        if (postFails) throw Object.assign(new Error("http 500"), { response: { status: 500, data: {} } });
        return { data: { id: "r-1", public_comment: "", ...body } };
      },
      get: async (url: string) => {
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ RATING_CRITERIA, RATING_CRITERIA_LABELS } = await import("@/lib/coachingApi"));
  P = await import("./PostSessionParts");
});

after(() => window.close());
beforeEach(() => {
  posted.length = 0;
  postFails = false;
});
afterEach(cleanup);

function withClient(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe("PostSessionBand", () => {
  it("is a pink band whose title is the page's h1, with the sentence, the meeting and the deadline", () => {
    render(
      <P.PostSessionBand
        title="Koçluk görüşmen tamamlandı"
        message="Elif hocan çalışma programını ve ilerleme raporunu en geç 24 saat içinde paylaşacak."
        meta="3. görüşme · 30 dk · 21 Ekim Çarşamba 19:00"
        deadline="22 Ekim Perşembe 19:30"
      />,
    );

    const title = screen.getByRole("heading", { level: 1, name: "Koçluk görüşmen tamamlandı" });
    assert.ok(title.closest(".bg-pink"), "the title sits on pink");
    assert.ok(screen.getByText(/en geç 24 saat içinde paylaşacak/));
    assert.ok(screen.getByText("3. görüşme · 30 dk · 21 Ekim Çarşamba 19:00"));
    const deadline = screen.getByText("22 Ekim Perşembe 19:30");
    assert.ok(within(deadline.parentElement as HTMLElement).getByText("Son tarih"), "the deadline is a small caption over a value");
  });

  it("leaves out the sentence and the deadline it was not given, and carries an action on the band", () => {
    render(<P.PostSessionBand title="Görüşme sürüyor" message="" meta="30 dk" deadline={null} action={<a href="/x">Odaya geri dön</a>} />);

    assert.equal(screen.queryByText("Son tarih"), null);
    assert.equal(document.querySelectorAll("section p").length, 1, "only the meeting line");
    assert.ok(screen.getByRole("link", { name: "Odaya geri dön" }));
  });
});

describe("PostSessionRow", () => {
  it("is a title, a caption and the one action of the row", () => {
    render(
      <P.PostSessionRow title="Sonraki görüşmeyi görüntüle" caption="28 Ekim Çarşamba 19:00 · 6 gün sonra">
        <a href="/y">Görüntüle</a>
      </P.PostSessionRow>,
    );

    assert.ok(screen.getByText("Sonraki görüşmeyi görüntüle"));
    assert.ok(screen.getByText("28 Ekim Çarşamba 19:00 · 6 gün sonra"));
    assert.ok(screen.getByRole("link", { name: "Görüntüle" }));
  });
});

describe("PostSessionDisclosure", () => {
  function Harness({ startOpen = false }: { startOpen?: boolean }) {
    const [open, setOpen] = useState(startOpen);
    return (
      <P.PostSessionDisclosure id="d" title="Bir sorun mu oldu?" caption="Teknik sorun bildirebilirsin" count="0 / 7" open={open} onToggle={() => setOpen(!open)}>
        <p>İçerik</p>
      </P.PostSessionDisclosure>
    );
  }

  it("says what is inside and how much before it is opened, and opens on a press", () => {
    render(<Harness />);

    const button = screen.getByRole("button", { name: /Bir sorun mu oldu\?/ });
    assert.equal(button.getAttribute("aria-expanded"), "false");
    assert.ok(within(button).getByText("Teknik sorun bildirebilirsin"));
    assert.ok(within(button).getByText("0 / 7"));
    assert.equal(screen.queryByText("İçerik"), null);

    fireEvent.click(button);
    assert.equal(button.getAttribute("aria-expanded"), "true");
    assert.ok(screen.getByText("İçerik"));
  });
});

describe("PostSessionRatingRow", () => {
  const scoreAll = () =>
    RATING_CRITERIA.forEach((criterion, index) =>
      fireEvent.click(screen.getByRole("button", { name: `${RATING_CRITERIA_LABELS[criterion]}: ${(index % 5) + 1} / 5` })),
    );

  it("opens with the seven criteria for a student who has not rated, and counts them as they are answered", () => {
    render(withClient(<P.PostSessionRatingRow sessionId="s-3" state="open" />));

    const row = screen.getByRole("button", { name: /Görüşmeyi değerlendir/ });
    assert.equal(row.getAttribute("aria-expanded"), "true");
    assert.ok(within(row).getByText("7 kısa ölçüt, her biri tek dokunuş"));
    assert.ok(within(row).getByText("0 / 7"));

    fireEvent.click(screen.getByRole("button", { name: `${RATING_CRITERIA_LABELS.program_benefit}: 5 / 5` }));
    fireEvent.click(screen.getByRole("button", { name: `${RATING_CRITERIA_LABELS.attentiveness}: 4 / 5` }));
    assert.ok(within(row).getByText("2 / 7"));
  });

  it("can be closed and opened again without losing what was chosen", () => {
    render(withClient(<P.PostSessionRatingRow sessionId="s-3" state="open" />));
    fireEvent.click(screen.getByRole("button", { name: `${RATING_CRITERIA_LABELS.program_benefit}: 5 / 5` }));

    const row = screen.getByRole("button", { name: /Görüşmeyi değerlendir/ });
    fireEvent.click(row);
    assert.equal(screen.queryByRole("button", { name: `${RATING_CRITERIA_LABELS.program_benefit}: 5 / 5` }), null);
    fireEvent.click(row);
    assert.equal(
      screen.getByRole("button", { name: `${RATING_CRITERIA_LABELS.program_benefit}: 5 / 5` }).getAttribute("aria-pressed"),
      "true",
    );
  });

  it("sends the seven scores and the comment, then thanks and closes", async () => {
    render(withClient(<P.PostSessionRatingRow sessionId="s-3" state="open" />));
    scoreAll();
    fireEvent.change(screen.getByRole("textbox", { name: "Herkese açık yorum" }), { target: { value: "Çok faydalıydı." } });
    fireEvent.click(screen.getByRole("button", { name: "Değerlendirmeyi gönder" }));

    await waitFor(() => assert.equal(posted.length, 1));
    assert.equal(posted[0].url, "/coaching/sessions/s-3/rating/");
    assert.equal(posted[0].body.public_comment, "Çok faydalıydı.");
    assert.equal(RATING_CRITERIA.filter((criterion) => typeof posted[0].body[criterion] === "number").length, 7);

    assert.ok(await screen.findByText("Değerlendirmen alındı, teşekkürler."));
    assert.equal(screen.queryByRole("button", { name: "Değerlendirmeyi gönder" }), null);
  });

  it("keeps the form when the server refuses, so nothing typed is lost", async () => {
    postFails = true;
    render(withClient(<P.PostSessionRatingRow sessionId="s-3" state="open" />));
    scoreAll();
    fireEvent.click(screen.getByRole("button", { name: "Değerlendirmeyi gönder" }));

    await waitFor(() => assert.equal(posted.length, 1));
    assert.ok(screen.getByRole("button", { name: "Değerlendirmeyi gönder" }));
    assert.equal(screen.queryByText("Değerlendirmen alındı, teşekkürler."), null);
  });

  it("is only a thank-you once the server says the meeting was rated", () => {
    render(withClient(<P.PostSessionRatingRow sessionId="s-3" state="done" />));

    assert.ok(screen.getByText("Görüşmeyi değerlendir"));
    assert.ok(screen.getByText("Değerlendirmen alındı, teşekkürler."));
    assert.equal(screen.queryByRole("button", { name: /Görüşmeyi değerlendir/ }), null);
    assert.equal(screen.queryByRole("button", { name: "Değerlendirmeyi gönder" }), null);
  });

  it("says in plain words when a written comment becomes public", () => {
    render(withClient(<P.PostSessionRatingRow sessionId="s-3" state="open" />));

    assert.ok(screen.getByText("Yazılı yorumun, ilk koçluk dönemin tamamlanınca herkese açık olabilir."));
  });
});

describe("PostSessionProblems", () => {
  const open = () => fireEvent.click(screen.getByRole("button", { name: /Bir sorun mu oldu\?/ }));

  it("keeps the technical report in a closed row and, for a tutor who was there, offers nothing else", async () => {
    render(withClient(<P.PostSessionProblems sessionId="s-3" noShow={{ kind: "hidden" }} />));

    const row = screen.getByRole("button", { name: /Bir sorun mu oldu\?/ });
    assert.equal(row.getAttribute("aria-expanded"), "false");
    assert.equal(screen.queryByRole("button", { name: "Teknik sorun bildir" }), null);

    open();
    const technical = screen.getByRole("button", { name: "Teknik sorun bildir" });
    assert.match(technical.className, /bg-gold/);
    assert.equal(screen.queryByRole("button", { name: "Öğretmen katılmadı bildir" }), null);

    fireEvent.change(screen.getByRole("textbox", { name: "Kısa not (isteğe bağlı)" }), { target: { value: "Ses gelmedi." } });
    fireEvent.click(technical);
    assert.equal(posted.length, 0, "nothing is sent before the confirmation");
    fireEvent.click(await screen.findByRole("button", { name: "Teknik sorunu bildir" }));
    await waitFor(() => assert.equal(posted.length, 1));
    assert.equal(posted[0].url, "/coaching/sessions/s-3/report-technical-issue/");
    assert.equal(posted[0].body.note, "Ses gelmedi.");
  });

  it("offers Öğretmen katılmadı bildir when the tutor was not there, and asks once before closing the meeting", async () => {
    render(withClient(<P.PostSessionProblems sessionId="s-3" noShow={{ kind: "available" }} />));
    open();

    const noShow = screen.getByRole("button", { name: "Öğretmen katılmadı bildir" });
    assert.match(noShow.className, /bg-gold/);
    assert.ok(screen.getByText("Öğretmen gelmezse bu görüşme hakkın korunur."));
    fireEvent.click(noShow);
    assert.equal(posted.length, 0);
    assert.ok(screen.getByRole("dialog", { name: '"Öğretmen katılmadı" bildirilsin mi?' }));

    fireEvent.click(screen.getByRole("button", { name: "Bildir" }));
    await waitFor(() => assert.equal(posted.length, 1));
    assert.equal(posted[0].url, "/coaching/sessions/s-3/report-no-show/");
    assert.equal(posted[0].body.party, "tutor");
  });

  it("says when Öğretmen katılmadı bildir opens instead of offering a button that would be refused", () => {
    render(withClient(<P.PostSessionProblems sessionId="s-3" noShow={{ kind: "later", opensAt: "19:10" }} />));
    open();

    assert.equal(screen.queryByRole("button", { name: "Öğretmen katılmadı bildir" }), null);
    assert.ok(screen.getByText("Öğretmen katılmadı bildirimi görüşmenin 10. dakikasından sonra yapılabilir (19:10)."));
    assert.ok(screen.getByRole("button", { name: "Teknik sorun bildir" }));
  });

  it("names the tutor's absence in the row's caption only when it can be reported", () => {
    const hidden = render(withClient(<P.PostSessionProblems sessionId="s-3" noShow={{ kind: "hidden" }} />));
    assert.ok(screen.getByText("Teknik sorun bildirebilirsin"));
    hidden.unmount();

    render(withClient(<P.PostSessionProblems sessionId="s-3" noShow={{ kind: "available" }} />));
    assert.ok(screen.getByText("Teknik sorun ya da öğretmenin katılmaması"));
  });
});
