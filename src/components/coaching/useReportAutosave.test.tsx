import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React, { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { CoachingReportDraftInput } from "@/lib/coachingApi";
import { useReportAutosave } from "./useReportAutosave";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
afterEach(cleanup);

const BASE: CoachingReportDraftInput = {
  short_summary: "",
  topics_discussed: "",
  student_progress: "",
  next_priorities: "",
  study_recommendations: "",
  focus_until_next_meeting: "",
};

type Api = ReturnType<typeof useReportAutosave>;

function Harness({
  save,
  enabled = true,
  delayMs = 20,
  onApi,
}: {
  save: (changes: Partial<CoachingReportDraftInput>) => Promise<unknown>;
  enabled?: boolean;
  delayMs?: number;
  onApi?: (api: Api) => void;
}) {
  const [value, setValue] = useState(BASE);
  const api = useReportAutosave({ value, enabled, save, delayMs, describeError: (error) => `hata: ${String(error)}` });
  onApi?.(api);
  return (
    <div>
      <textarea
        aria-label="özet"
        value={value.short_summary}
        onChange={(event) => setValue({ ...value, short_summary: event.target.value })}
      />
      <textarea
        aria-label="konular"
        value={value.topics_discussed}
        onChange={(event) => setValue({ ...value, topics_discussed: event.target.value })}
      />
      <p data-testid="status">{api.status.kind === "error" ? api.status.message : api.status.kind}</p>
    </div>
  );
}

const type = (label: string, text: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: text } });
const status = () => screen.getByTestId("status").textContent;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("useReportAutosave", () => {
  it("saves nothing while nothing has changed", async () => {
    const calls: unknown[] = [];
    render(<Harness save={async (changes) => calls.push(changes)} />);

    await wait(80);
    assert.deepEqual(calls, []);
    assert.equal(status(), "idle");
  });

  it("saves only the field that changed, once, after the typing stops", async () => {
    const calls: unknown[] = [];
    render(<Harness save={async (changes) => calls.push(changes)} />);

    type("özet", "a");
    type("özet", "ab");
    type("özet", "abc");
    assert.equal(status(), "dirty");
    await waitFor(() => assert.equal(calls.length, 1));

    assert.deepEqual(calls, [{ short_summary: "abc" }]);
    await waitFor(() => assert.equal(status(), "saved"));
  });

  it("does not save the same text twice", async () => {
    const calls: unknown[] = [];
    render(<Harness save={async (changes) => calls.push(changes)} />);

    type("özet", "a");
    await waitFor(() => assert.equal(calls.length, 1));
    await waitFor(() => assert.equal(status(), "saved"));
    type("özet", "a");
    await wait(80);

    assert.equal(calls.length, 1);
  });

  it("keeps what was typed while a save is on its way, and saves it next", async () => {
    const calls: Partial<CoachingReportDraftInput>[] = [];
    let release: () => void = () => {};
    const save = (changes: Partial<CoachingReportDraftInput>) => {
      calls.push(changes);
      return calls.length === 1 ? new Promise<void>((resolve) => (release = resolve)) : Promise.resolve();
    };
    render(<Harness save={save} />);

    type("özet", "ilk");
    await waitFor(() => assert.equal(calls.length, 1));
    assert.equal(status(), "saving");
    type("özet", "ilk ve devamı");
    release();

    await waitFor(() => assert.equal(calls.length, 2));
    assert.deepEqual(calls[1], { short_summary: "ilk ve devamı" });
    assert.equal((screen.getByLabelText("özet") as HTMLTextAreaElement).value, "ilk ve devamı");
    await waitFor(() => assert.equal(status(), "saved"));
  });

  it("says it could not save, does not loop, and tries again when asked", async () => {
    let attempts = 0;
    let api: Api | undefined;
    const save = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("sunucu");
    };
    render(<Harness save={save} onApi={(value) => (api = value)} />);

    type("özet", "metin");
    await waitFor(() => assert.match(status() ?? "", /^hata: Error: sunucu/));
    await wait(80);
    assert.equal(attempts, 1);

    await act(async () => {
      api?.retry();
    });
    await waitFor(() => assert.equal(status(), "saved"));
    assert.equal(attempts, 2);
  });

  it("saves at once when asked, and says whether it worked", async () => {
    const calls: unknown[] = [];
    let api: Api | undefined;
    render(<Harness save={async (changes) => calls.push(changes)} delayMs={5000} onApi={(value) => (api = value)} />);

    type("konular", "bir şeyler");
    let ok: boolean | undefined;
    await act(async () => {
      ok = await api?.flush();
    });

    assert.equal(ok, true);
    assert.deepEqual(calls, [{ topics_discussed: "bir şeyler" }]);
  });

  it("reports a failed flush as a failure, so a publish does not go ahead on a draft that was not saved", async () => {
    let api: Api | undefined;
    render(
      <Harness
        save={async () => {
          throw new Error("kayıt yok");
        }}
        delayMs={5000}
        onApi={(value) => (api = value)}
      />,
    );

    type("özet", "metin");
    let ok: boolean | undefined;
    await act(async () => {
      ok = await api?.flush();
    });

    assert.equal(ok, false);
  });

  it("has nothing to flush when nothing changed", async () => {
    const calls: unknown[] = [];
    let api: Api | undefined;
    render(<Harness save={async (changes) => calls.push(changes)} onApi={(value) => (api = value)} />);

    let ok: boolean | undefined;
    await act(async () => {
      ok = await api?.flush();
    });

    assert.equal(ok, true);
    assert.deepEqual(calls, []);
  });

  it("does not save before it is enabled (the server draft has not been read yet)", async () => {
    const calls: unknown[] = [];
    render(<Harness save={async (changes) => calls.push(changes)} enabled={false} />);

    type("özet", "metin");
    await wait(80);

    assert.deepEqual(calls, []);
  });

  it("saves the moment the tab is hidden", async () => {
    const calls: unknown[] = [];
    render(<Harness save={async (changes) => calls.push(changes)} delayMs={5000} />);

    type("özet", "metin");
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    try {
      document.dispatchEvent(new window.Event("visibilitychange"));
      await waitFor(() => assert.deepEqual(calls, [{ short_summary: "metin" }]));
    } finally {
      Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    }
  });

  it("warns before the page is left while something is unsaved, and only then", async () => {
    render(<Harness save={async () => undefined} delayMs={5000} />);

    const clean = new window.Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    assert.equal(clean.defaultPrevented, false);

    type("özet", "metin");
    const unsaved = new window.Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unsaved);
    assert.equal(unsaved.defaultPrevented, true);
  });

  it("saves what is pending when the page it lives on is closed inside the app", async () => {
    const calls: unknown[] = [];
    const view = render(<Harness save={async (changes) => calls.push(changes)} delayMs={5000} />);

    type("özet", "metin");
    view.unmount();

    await waitFor(() => assert.deepEqual(calls, [{ short_summary: "metin" }]));
  });
});
