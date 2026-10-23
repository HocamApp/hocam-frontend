import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { EarlyEndView } from "@/lib/coachingEarlyEnd";

import { EarlyEndIncomingDialog, EarlyEndPanelSection } from "./CoachingEarlyEndControls";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

after(() => window.close());
afterEach(cleanup);

type SectionProps = React.ComponentProps<typeof EarlyEndPanelSection>;

function section(overrides: Partial<SectionProps> = {}) {
  const calls = { ask: 0, withdraw: 0 };
  const props: SectionProps = {
    view: { kind: "idle", notice: null },
    otherName: "Elif Kaya",
    isPending: false,
    error: null,
    onAsk: () => { calls.ask += 1; },
    onWithdraw: () => { calls.withdraw += 1; },
    ...overrides,
  };
  return { calls, ui: <EarlyEndPanelSection {...props} /> };
}

describe("EarlyEndPanelSection", () => {
  it("offers the button as a secondary one and asks before sending anything", () => {
    const { calls, ui } = section();
    render(ui);

    assert.ok(screen.getByRole("heading", { name: "Görüşmeyi birlikte bitir" }));
    const button = screen.getByRole("button", { name: "Birlikte bitir" });
    assert.match(button.className, /min-h-11/, "a touch target");
    assert.match(button.className, /bg-transparent/, "a secondary button: neither the main action nor a danger");

    fireEvent.click(button);
    assert.equal(calls.ask, 0, "nothing is sent by the first click");
    const dialog = screen.getByRole("dialog", { name: "Görüşmeyi birlikte bitirmek istiyor musun?" });
    assert.ok(
      within(dialog).getByText("Elif Kaya kabul ederse görüşme şimdi tamamlanmış sayılır. Kabul etmezse görüşme devam eder."),
    );
    assert.equal(document.activeElement, within(dialog).getByRole("button", { name: "Vazgeç" }), "a stray Enter is safe");
  });

  it("sends the request only from the dialog's own button", () => {
    const { calls, ui } = section();
    render(ui);

    fireEvent.click(screen.getByRole("button", { name: "Birlikte bitir" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "İste" }));

    assert.equal(calls.ask, 1);
  });

  it("closes the dialog without sending when the person changes their mind", () => {
    const { calls, ui } = section();
    render(ui);

    fireEvent.click(screen.getByRole("button", { name: "Birlikte bitir" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Vazgeç" }));

    assert.equal(screen.queryByRole("dialog"), null);
    assert.equal(calls.ask, 0);
  });

  it("closes the dialog once the request is out, so the waiting line takes over", () => {
    const { ui } = section();
    const view = render(ui);
    fireEvent.click(screen.getByRole("button", { name: "Birlikte bitir" }));
    assert.ok(screen.getByRole("dialog"));

    view.rerender(section({ view: { kind: "waiting", version: 1 } }).ui);

    assert.equal(screen.queryByRole("dialog"), null);
  });

  it("says it is waiting and lets the asker take the request back", () => {
    const { calls, ui } = section({ view: { kind: "waiting", version: 3 } });
    render(ui);

    const status = screen.getByRole("status");
    assert.match(status.textContent ?? "", /Yanıt bekleniyor/);
    assert.match(status.textContent ?? "", /Elif Kaya kabul ederse görüşme tamamlanmış sayılır/);
    assert.equal(screen.queryByRole("button", { name: "Birlikte bitir" }), null);

    fireEvent.click(screen.getByRole("button", { name: "İsteği geri çek" }));
    assert.equal(calls.withdraw, 1);
  });

  it("holds the button back during the cooldown and says for how long", () => {
    const { ui } = section({ view: { kind: "cooldown", notice: null, label: "Yeni bir istek için 4 dk beklemelisin." } });
    render(ui);

    assert.equal((screen.getByRole("button", { name: "Birlikte bitir" }) as HTMLButtonElement).disabled, true);
    assert.ok(screen.getByText("Yeni bir istek için 4 dk beklemelisin."));
  });

  it("shows what became of the last request, in the status line", () => {
    const { ui } = section({
      view: { kind: "cooldown", notice: "Elif Kaya görüşmeye devam etmek istiyor.", label: "Yeni bir istek için 5 dk beklemelisin." },
    });
    render(ui);

    assert.match(screen.getByRole("status").textContent ?? "", /Elif Kaya görüşmeye devam etmek istiyor\./);
  });

  it("tells the person the other side is asking, without a second way to answer it", () => {
    const { ui } = section({ view: { kind: "incoming", version: 2, minute: 7 } });
    render(ui);

    assert.match(screen.getByRole("status").textContent ?? "", /Elif Kaya görüşmeyi bitirmek istiyor/);
    assert.equal(screen.queryByRole("button", { name: "Kabul et" }), null, "the answer is the dialog's");
    assert.equal(screen.queryByRole("button", { name: "Birlikte bitir" }), null, "no second request over theirs");
  });

  it("shows a failed request as an inline error next to the button", () => {
    const { ui } = section({ error: "Görüşme şu anda sürmüyor." });
    render(ui);

    assert.ok(screen.getByText("Görüşme şu anda sürmüyor."));
  });

  it("renders nothing at all when the feature is hidden", () => {
    const { ui } = section({ view: { kind: "hidden" } });
    const view = render(ui);

    assert.equal(view.container.textContent, "");
  });

  it("locks the dialog while the request is in flight", () => {
    const first = render(section().ui);
    fireEvent.click(screen.getByRole("button", { name: "Birlikte bitir" }));
    first.rerender(section({ isPending: true }).ui);

    const dialog = screen.getByRole("dialog");
    assert.equal((within(dialog).getByRole("button", { name: "İste" }) as HTMLButtonElement).disabled, true);
    assert.equal((within(dialog).getByRole("button", { name: "Vazgeç" }) as HTMLButtonElement).disabled, true);
  });
});

type DialogProps = React.ComponentProps<typeof EarlyEndIncomingDialog>;

function dialog(overrides: Partial<DialogProps> = {}) {
  const calls = { accept: 0, keep: 0 };
  const props: DialogProps = {
    view: { kind: "incoming", version: 2, minute: 7 } as EarlyEndView,
    role: "student",
    otherName: "Elif Kaya",
    isPending: false,
    error: null,
    onAccept: () => { calls.accept += 1; },
    onContinue: () => { calls.keep += 1; },
    ...overrides,
  };
  return { calls, ui: <EarlyEndIncomingDialog {...props} /> };
}

describe("EarlyEndIncomingDialog", () => {
  it("tells a student which minute it is and what a yes means for the meeting", () => {
    render(dialog().ui);

    const box = screen.getByRole("dialog", { name: "Elif Kaya görüşmeyi bitirmek istiyor" });
    assert.ok(
      within(box).getByText(
        "Elif Kaya görüşmeyi bitirmek istiyor. Görüşme 7. dakikada. Kabul edersen görüşme tamamlanmış sayılır; kalan süre için ek görüşme hakkı doğmaz.",
      ),
    );
  });

  it("tells a tutor the report is still theirs", () => {
    render(dialog({ role: "tutor", otherName: "Deniz Yıldız", view: { kind: "incoming", version: 1, minute: 12 } }).ui);

    assert.ok(
      screen.getByText(
        "Deniz Yıldız görüşmeyi bitirmek istiyor. Görüşme 12. dakikada. Kabul edersen görüşme biter; raporu yine sen hazırlarsın.",
      ),
    );
  });

  it("starts on 'Devam et' so a stray Enter does not end the meeting", () => {
    render(dialog().ui);

    assert.equal(document.activeElement, screen.getByRole("button", { name: "Devam et" }));
  });

  it("answers yes and no with the two buttons", () => {
    const yes = dialog();
    const first = render(yes.ui);
    fireEvent.click(screen.getByRole("button", { name: "Kabul et" }));
    assert.deepEqual(yes.calls, { accept: 1, keep: 0 });
    first.unmount();

    const no = dialog();
    render(no.ui);
    fireEvent.click(screen.getByRole("button", { name: "Devam et" }));
    assert.deepEqual(no.calls, { accept: 0, keep: 1 });
  });

  it("treats Escape as 'Devam et', the way the lesson's own prompt does", () => {
    const { calls, ui } = dialog();
    render(ui);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    assert.deepEqual(calls, { accept: 0, keep: 1 });
  });

  it("cannot be dismissed while an answer is on its way", () => {
    const { calls, ui } = dialog({ isPending: true });
    render(ui);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    assert.equal(calls.keep, 0);
    assert.equal((screen.getByRole("button", { name: "Kabul et" }) as HTMLButtonElement).disabled, true);
    assert.equal((screen.getByRole("button", { name: "Devam et" }) as HTMLButtonElement).disabled, true);
  });

  it("stays open and says so when the answer failed", () => {
    render(dialog({ error: "İstek değişmiş. Güncel durum yüklendi." }).ui);

    assert.ok(screen.getByRole("dialog"));
    assert.ok(screen.getByText("İstek değişmiş. Güncel durum yüklendi."));
  });

  it("is not there unless the other side is asking", () => {
    for (const view of [
      { kind: "hidden" },
      { kind: "idle", notice: null },
      { kind: "waiting", version: 1 },
      { kind: "cooldown", notice: null, label: "x" },
    ] as EarlyEndView[]) {
      const { ui } = dialog({ view });
      const rendered = render(ui);
      assert.equal(screen.queryByRole("dialog"), null, view.kind);
      rendered.unmount();
    }
  });
});
