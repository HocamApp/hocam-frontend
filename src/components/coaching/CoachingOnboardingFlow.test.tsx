import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

type State = Record<string, unknown> & {
  current_step: number;
  current_step_key: string | null;
  is_completed: boolean;
  control_question_answers: Record<string, { answer: string; is_correct: boolean }>;
  has_accepted_current_contract: boolean;
};

const STEPS = ["carousel", "control_questions", "contract", "plan"];
const CORRECT: Record<string, string> = { q1: "b", q2: "x" };

function fresh(): State {
  return {
    current_step: 0,
    current_step_key: "carousel",
    steps: STEPS,
    is_completed: false,
    completed_at: null,
    control_question_answers: {},
    all_control_questions_correct: false,
    has_accepted_current_contract: false,
    carousel_slides: [
      { id: "s1", title: "Koçluk, özel dersten farklıdır", body: "Konu anlatmazsın; planlar ve takip edersin." },
      { id: "s2", title: "Hizmet kapsamın", body: "30 dakikalık görüşme, program, rapor." },
      { id: "s3", title: "Mesajlara 24 saat içinde yanıt", body: "Hafta sonu dahil." },
    ],
    control_questions: [
      { id: "q1", question: "Günlük takip zorunlu mu?", options: [{ value: "a", label: "Evet" }, { value: "b", label: "Hayır" }] },
      { id: "q2", question: "Rapor zorunlu mu?", options: [{ value: "x", label: "Evet" }, { value: "y", label: "Hayır" }] },
    ],
    contract: { version: 1, text: "1. HİZMET KAPSAMI\nÖğretmen hizmet sunar.\n\n2. KOMİSYON\n%17,5.", terms_hash: "h" },
  };
}

let server: State = fresh();
let calls: { url: string; body?: unknown }[] = [];
let loadFails = false;
let failNext: string | null = null;
let CoachingOnboardingFlow: React.ComponentType;

function httpError(detail: string) {
  return Object.assign(new Error(detail), { response: { status: 400, data: { detail } } });
}

function allCorrect(answers: State["control_question_answers"]) {
  return Object.keys(CORRECT).every((id) => answers[id]?.is_correct === true);
}

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url !== "/coaching/onboarding/") throw new Error(`unexpected GET ${url}`);
        if (loadFails) throw Object.assign(new Error("x"), { response: { status: 500 } });
        return { data: structuredClone(server) };
      },
      post: async (url: string, body?: { target_step?: number; question_id?: string; answer?: string }) => {
        calls.push({ url, body });
        if (failNext === url) {
          failNext = null;
          throw httpError("Sunucu reddetti.");
        }
        if (url === "/coaching/onboarding/advance/") {
          server.current_step = body!.target_step!;
          server.current_step_key = STEPS[server.current_step];
          return { data: structuredClone(server) };
        }
        if (url === "/coaching/onboarding/answer/") {
          const correct = CORRECT[body!.question_id!] === body!.answer;
          server.control_question_answers = {
            ...server.control_question_answers,
            [body!.question_id!]: { answer: body!.answer!, is_correct: correct },
          };
          server.all_control_questions_correct = allCorrect(server.control_question_answers);
          return {
            data: {
              question_id: body!.question_id,
              is_correct: correct,
              explanation: correct ? "" : "Hayır. Günlük takip zorunlu hizmet değildir.",
            },
          };
        }
        if (url === "/coaching/onboarding/accept-contract/") {
          server.has_accepted_current_contract = true;
          return { data: { contract_version: 1, accepted_at: "2026-10-23T08:00:00Z" } };
        }
        if (url === "/coaching/onboarding/complete/") {
          server.is_completed = true;
          server.current_step = 3;
          server.current_step_key = "plan";
          return { data: structuredClone(server) };
        }
        throw new Error(`unexpected POST ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ CoachingOnboardingFlow } = await import("./CoachingOnboardingFlow"));
});

beforeEach(() => {
  server = fresh();
  calls = [];
  loadFails = false;
  failNext = null;
});
afterEach(cleanup);

function renderFlow() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CoachingOnboardingFlow />
    </QueryClientProvider>
  );
}

const stepper = () => screen.getByRole("list", { name: "Koçluk tanıtım adımları" });
const answerQuestion = async (label: string) => {
  fireEvent.click(await screen.findByLabelText(label));
};

describe("the steps", () => {
  it("are three, numbered, with the one the tutor is on marked", async () => {
    renderFlow();
    await screen.findByRole("heading", { name: "Tanıtım" });
    const items = within(stepper()).getAllByRole("listitem");
    assert.equal(items.length, 3);
    assert.equal(items.map((item) => (item.textContent ?? "").replace(/,.*/, "").replace(/—/, "")).join("|"), "1Tanıtım|2Hızlı kontrol|3Sözleşme");
    assert.equal(items[0].getAttribute("aria-current"), "step");
    assert.ok(screen.queryByText(/Teklif/) === null);
  });
});

describe("the introduction", () => {
  it("shows every point at once, numbered, with no slides to page through", async () => {
    renderFlow();
    const list = await screen.findByRole("list", { name: "Koçlukta seni neler bekliyor" });
    const points = within(list).getAllByRole("listitem");
    assert.equal(points.length, 3);
    assert.ok(within(points[0]).getByText("Koçluk, özel dersten farklıdır"));
    assert.ok(within(points[2]).getByText("Hafta sonu dahil."));
    assert.ok(screen.queryByRole("button", { name: /sonraki|önceki/i }) === null);
  });

  it("goes on to the quick check one step at a time", async () => {
    renderFlow();
    fireEvent.click(await screen.findByRole("button", { name: "Hızlı kontrole geç" }));

    await screen.findByText("Günlük takip zorunlu mu?");
    assert.deepEqual(calls[0], { url: "/coaching/onboarding/advance/", body: { target_step: 1 } });
  });
});

describe("the quick check", () => {
  beforeEach(() => {
    server.current_step = 1;
    server.current_step_key = "control_questions";
  });

  it("says plainly that a right answer is needed to go on, and how many are left", async () => {
    renderFlow();
    await screen.findByText("Günlük takip zorunlu mu?");
    assert.ok(screen.getByText(/Doğru yanıtı bulana kadar deneyebilirsin/));
    assert.ok(screen.getByText("Sözleşmeye geçmek için 2 soru daha var."));
    assert.equal((screen.getByRole("button", { name: "Sözleşmeye geç" }) as HTMLButtonElement).disabled, true);
  });

  it("explains a wrong answer from the server and lets the tutor try again", async () => {
    renderFlow();
    await answerQuestion("Evet");
    assert.ok(await screen.findByText("Hayır. Günlük takip zorunlu hizmet değildir."));
    assert.ok(screen.getByText("Sözleşmeye geçmek için 2 soru daha var."));
    await answerQuestion("Hayır");
    await screen.findByText("Rapor zorunlu mu?");
    assert.ok(screen.getByText("Sözleşmeye geçmek için 1 soru daha var."));
  });

  it("opens the contract once every answer is right", async () => {
    renderFlow();
    await answerQuestion("Hayır");
    await screen.findByText("Rapor zorunlu mu?");
    await answerQuestion("Evet");
    await waitFor(() => assert.equal((screen.getByRole("button", { name: "Sözleşmeye geç" }) as HTMLButtonElement).disabled, false));
    assert.ok(screen.queryByText(/soru daha var/) === null);

    fireEvent.click(screen.getByRole("button", { name: "Sözleşmeye geç" }));
    await screen.findByRole("heading", { name: "Koçluk sözleşmesi" });
    assert.deepEqual(calls[calls.length - 1], { url: "/coaching/onboarding/advance/", body: { target_step: 2 } });
  });
});

describe("the contract", () => {
  beforeEach(() => {
    server.current_step = 2;
    server.current_step_key = "contract";
  });

  it("shows the server's text and its version", async () => {
    renderFlow();
    const box = await screen.findByRole("region", { name: "Sözleşme metni" });
    assert.ok(within(box).getByText(/1\. HİZMET KAPSAMI/));
    assert.ok(within(box).getByText(/%17,5/));
    assert.ok(screen.getByText("Sürüm 1"));
  });

  it("accepts and finishes with one tap, in that order, and ends on the done screen", async () => {
    renderFlow();
    fireEvent.click(await screen.findByRole("button", { name: "Kabul ediyorum, bitir" }));

    assert.ok(await screen.findByRole("heading", { name: "Koçluk tanıtımı tamamlandı" }));
    assert.deepEqual(calls.map((call) => call.url), ["/coaching/onboarding/accept-contract/", "/coaching/onboarding/complete/"]);
    const next = screen.getByRole("link", { name: "Teklifini oluştur" });
    assert.equal(next.getAttribute("href"), "/dashboard/tutor/coaching/plan?step=frequency");
    assert.ok(screen.getByText("Görüşme düzeni · Fiyat · Sınavlar · Açıklama · Saatler · Kapasite · Yayın"));
  });

  it("does not finish when the server refuses the acceptance, and says so by the button", async () => {
    failNext = "/coaching/onboarding/accept-contract/";
    renderFlow();
    fireEvent.click(await screen.findByRole("button", { name: "Kabul ediyorum, bitir" }));

    assert.equal((await screen.findByRole("alert")).textContent, "Sunucu reddetti.");
    assert.deepEqual(calls.map((call) => call.url), ["/coaching/onboarding/accept-contract/"]);
    assert.ok(screen.getByRole("button", { name: "Kabul ediyorum, bitir" }));
  });

  it("offers only to finish when the acceptance went through but finishing did not", async () => {
    failNext = "/coaching/onboarding/complete/";
    renderFlow();
    fireEvent.click(await screen.findByRole("button", { name: "Kabul ediyorum, bitir" }));

    assert.equal((await screen.findByRole("alert")).textContent, "Sunucu reddetti.");
    fireEvent.click(await screen.findByRole("button", { name: "Tanıtımı bitir" }));
    await screen.findByRole("heading", { name: "Koçluk tanıtımı tamamlandı" });
    assert.deepEqual(calls.map((call) => call.url), [
      "/coaching/onboarding/accept-contract/",
      "/coaching/onboarding/complete/",
      "/coaching/onboarding/complete/",
    ]);
  });
});

describe("a tutor the server left on the old last step", () => {
  it("sees the contract, already accepted, and finishes without accepting again", async () => {
    server.current_step = 3;
    server.current_step_key = "plan";
    server.has_accepted_current_contract = true;
    renderFlow();

    assert.ok(await screen.findByText("Güncel sözleşmeyi kabul ettin."));
    fireEvent.click(screen.getByRole("button", { name: "Tanıtımı bitir" }));
    await screen.findByRole("heading", { name: "Koçluk tanıtımı tamamlandı" });
    assert.deepEqual(calls.map((call) => call.url), ["/coaching/onboarding/complete/"]);
  });
});

describe("when it is already done or cannot be read", () => {
  it("shows the done screen straight away", async () => {
    server.is_completed = true;
    server.current_step = 3;
    server.current_step_key = "plan";
    renderFlow();
    assert.ok(await screen.findByRole("heading", { name: "Koçluk tanıtımı tamamlandı" }));
  });

  it("says it could not be loaded, with a way to try again", async () => {
    loadFails = true;
    renderFlow();
    assert.ok(await screen.findByText(/Koçluk kurulumun yüklenemedi/));
    assert.ok(screen.getByRole("button", { name: "Tekrar dene" }));
  });
});
