import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { MatchingOptions } from "@/types";

// framer-motion and useMediaQuery both read matchMedia, which the shared jsdom
// setup does not provide.
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

const LEGACY_KEY = "hocam:matching-draft:v1:student-1";
const DRAFT_KEY = "hocam:hoca-bul-draft:v1:student-1";
const NOW = Date.now();

const options: MatchingOptions = {
  goals: [
    { value: "YKS", label: "YKS" },
    { value: "DGS", label: "DGS" },
    { value: "KPSS", label: "KPSS" },
    { value: "UNDECIDED", label: "Henüz karar vermedim" },
  ],
  stages: {
    YKS: [
      { value: "grade_9", label: "9. sınıf" },
      { value: "grade_10", label: "10. sınıf" },
      { value: "grade_11", label: "11. sınıf" },
      { value: "grade_12", label: "12. sınıf" },
      { value: "graduate", label: "Mezun" },
      { value: "other", label: "Başka bir durum" },
    ],
    DGS: [
      { value: "starting", label: "Hazırlanmaya yeni başladım" },
      { value: "ongoing", label: "Bir süredir hazırlanıyorum" },
      { value: "retaking", label: "Sınava daha önce girdim" },
      { value: "intensive", label: "Son dönemde yoğunlaşmak istiyorum" },
    ],
    KPSS: [
      { value: "starting", label: "Hazırlanmaya yeni başladım" },
      { value: "ongoing", label: "Düzenli hazırlanıyorum" },
      { value: "retaking", label: "Sınava daha önce girdim" },
      { value: "intensive", label: "Son dönemde yoğunlaşmak istiyorum" },
    ],
    UNDECIDED: [
      { value: "exploring", label: "Hedefimi belirlemeye çalışıyorum" },
      { value: "lesson_support", label: "Belirli derslerde destek arıyorum" },
      { value: "exam_considering", label: "Bir sınava hazırlanmayı düşünüyorum" },
    ],
  },
  subjects: [
    {
      key: "matematik",
      label: "Matematik",
      subject_ids: ["1"],
      exam_types: ["TYT", "AYT"],
      tutor_count: 9,
    },
    { key: "edebiyat", label: "Edebiyat", subject_ids: ["2"], exam_types: ["AYT"], tutor_count: 4 },
    { key: "ingilizce", label: "İngilizce", subject_ids: ["3"], exam_types: ["YDT"], tutor_count: 3 },
    { key: "fizik", label: "Fizik", subject_ids: ["4"], exam_types: ["TYT"], tutor_count: 2 },
    { key: "kimya", label: "Kimya", subject_ids: ["5"], exam_types: ["TYT"], tutor_count: 0 },
  ],
  budget_ranges: [
    { id: "economical", label: "Ekonomik", min: null, max: 300 },
    { id: "balanced", label: "Dengeli", min: 400, max: 700 },
    { id: "premium", label: "Premium", min: 900, max: null },
    { id: "flexible", label: "Fiyat konusunda esneğim", min: null, max: null },
  ],
};

let fetchCalls = 0;
const queryCalls: Array<{ goal: string; subjectKeys: string[] }> = [];
let shouldFail = false;
let currentOptions = options;
let searchParams = new URLSearchParams();
const routerCalls: Array<{ method: string; href?: string }> = [];

let Wizard: (() => React.ReactNode) | null = null;

async function loadWizard() {
  if (Wizard) return;

  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({ user: { id: "student-1", role: "student" }, isLoading: false }),
    },
  });
  mock.module("@/lib/matchingApi", {
    namedExports: {
      fetchMatchingOptions: async (goal: string, subjectKeys: string[]) => {
        fetchCalls += 1;
        queryCalls.push({ goal, subjectKeys: [...subjectKeys] });
        if (shouldFail) throw new Error("options unavailable");
        return currentOptions;
      },
    },
  });
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push({ method: "push", href }),
        replace: (href: string) => routerCalls.push({ method: "replace", href }),
        back: () => routerCalls.push({ method: "back" }),
      }),
      useSearchParams: () => searchParams,
      usePathname: () => "/hoca-bul",
    },
  });

  Wizard = (await import("./HocaBulWizard"))
    .HocaBulWizard as unknown as () => React.ReactNode;
}

function renderWizard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      {Wizard ? <Wizard /> : null}
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  await loadWizard();
  fetchCalls = 0;
  shouldFail = false;
  currentOptions = options;
  queryCalls.length = 0;
  searchParams = new URLSearchParams();
  routerCalls.length = 0;
  window.localStorage.clear();
});

async function continueWith(label: string | RegExp) {
  fireEvent.click(await screen.findByRole("radio", { name: label }));
  await clickContinue();
}

async function clickContinue() {
  const button = screen.getByRole("button", { name: /Devam et/ });
  await waitFor(() => assert.equal(button.hasAttribute("disabled"), false));
  fireEvent.click(button);
}

async function reachDgsSubjects() {
  await continueWith("DGS");
  await continueWith("Bir süredir hazırlanıyorum");
  await screen.findByRole("heading", { name: "Hangi derslerde desteğe ihtiyacın var?" });
}

afterEach(() => {
  cleanup();
});

describe("P3A question screens", () => {
  it("renders the exact goal choices and disables Continue until one is selected", async () => {
    renderWizard();

    const heading = await screen.findByRole("heading", { level: 1 });
    assert.equal(heading.textContent, "Hangi sınava hazırlanıyorsun?");
    assert.deepEqual(
      (await screen.findAllByRole("radio")).map((radio) => radio.textContent?.trim()),
      ["YKS", "DGS", "KPSS", "Henüz karar vermedim"]
    );
    assert.equal(screen.getByRole("button", { name: /Devam et/ }).hasAttribute("disabled"), true);
    assert.ok(screen.getByText("1 / 8"));
  });

  it("switches the total to nine once the goal is YKS", async () => {
    renderWizard();
    const yks = await screen.findByRole("radio", { name: "YKS" });

    fireEvent.click(yks);

    await waitFor(() => assert.ok(screen.getAllByText("1 / 9").length > 0));
  });

  it("shows an accessible retry when the options fail, and retrying refetches", async () => {
    shouldFail = true;
    renderWizard();

    const retry = await screen.findByRole("button", { name: /Tekrar dene/ });
    assert.ok(screen.getByText("Seçenekler şu anda yüklenemedi."));
    assert.equal(screen.getByRole("button", { name: /Devam et/ }).hasAttribute("disabled"), true);
    const callsBeforeRetry = fetchCalls;

    shouldFail = false;
    fireEvent.click(retry);

    await waitFor(() => assert.ok(fetchCalls > callsBeforeRetry));
    // The question itself never disappeared, so nothing the student answered is lost.
    await waitFor(() =>
      assert.equal(
        screen.getByRole("heading", { level: 1 }).textContent,
        "Hangi sınava hazırlanıyorsun?"
      )
    );
  });

  it("writes the real goal to the draft, then always moves hedef to asama", async () => {
    renderWizard();
    fireEvent.click(await screen.findByRole("radio", { name: "DGS" }));

    await waitFor(() => {
      const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "{}");
      assert.equal(draft.answers?.goal, "DGS");
    });

    await clickContinue();

    await waitFor(() =>
      assert.equal(
        screen.getByRole("heading", { level: 1 }).textContent,
        "Şu an hangi aşamadasın?"
      )
    );
    assert.ok(routerCalls.some((call) => call.href === "?adim=asama"));
  });

  it("moves h1 focus when the step changes", async () => {
    renderWizard();
    fireEvent.click(await screen.findByRole("radio", { name: "DGS" }));
    await clickContinue();

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Şu an hangi aşamadasın?",
    });
    await waitFor(() => assert.equal(document.activeElement, heading));
  });

  it("renders the goal-specific stage choices with exact API values", async () => {
    renderWizard();
    fireEvent.click(await screen.findByRole("radio", { name: "KPSS" }));
    await clickContinue();

    await screen.findByRole("heading", { name: "Şu an hangi aşamadasın?" });
    assert.deepEqual(
      screen.getAllByRole("radio").map((radio) => ({
        label: radio.textContent?.trim(),
        value: radio.getAttribute("data-value"),
      })),
      [
        { label: "Hazırlanmaya yeni başladım", value: "starting" },
        { label: "Bir süredir hazırlanıyorum", value: "ongoing" },
        { label: "Sınava daha önce girdim", value: "retaking" },
        { label: "Son dönemde yoğunlaşmak istiyorum", value: "intensive" },
      ]
    );
  });

  for (const [goal, stage, expectedStep] of [
    ["YKS", "12. sınıf", "YKS’de neye ağırlık vereceksin?"],
    ["DGS", "Bir süredir hazırlanıyorum", "Hangi derslerde desteğe ihtiyacın var?"],
    ["KPSS", "Bir süredir hazırlanıyorum", "Hangi derslerde desteğe ihtiyacın var?"],
    ["Henüz karar vermedim", "Hedefimi belirlemeye çalışıyorum", "Hangi derslerde desteğe ihtiyacın var?"],
  ] as const) {
    it(`branches ${goal} after asama`, async () => {
      renderWizard();
      fireEvent.click(await screen.findByRole("radio", { name: goal }));
      await clickContinue();
      fireEvent.click(await screen.findByRole("radio", { name: stage }));
      await clickContinue();

      await screen.findByRole("heading", { level: 1, name: expectedStep });
    });
  }

  it("supports YKS area combinations and exclusive unsure selection", async () => {
    renderWizard();
    fireEvent.click(await screen.findByRole("radio", { name: "YKS" }));
    await clickContinue();
    fireEvent.click(await screen.findByRole("radio", { name: "12. sınıf" }));
    await clickContinue();

    await screen.findByRole("heading", { name: "YKS’de neye ağırlık vereceksin?" });
    const tyt = screen.getByRole("button", { name: /TYT Temel Yeterlilik/ });
    const ayt = screen.getByRole("button", { name: /AYT Alan Yeterlilik/ });
    const ydt = screen.getByRole("button", { name: /YDT Yabancı Dil/ });
    const unsure = screen.getByRole("button", { name: "Emin değilim" });
    assert.equal(screen.getByRole("button", { name: /Devam et/ }).hasAttribute("disabled"), true);

    fireEvent.click(tyt);
    fireEvent.click(ayt);
    fireEvent.click(ydt);
    assert.equal(tyt.getAttribute("aria-pressed"), "true");
    assert.equal(ayt.getAttribute("aria-pressed"), "true");
    assert.equal(ydt.getAttribute("aria-pressed"), "true");
    assert.equal(screen.getByRole("button", { name: /Devam et/ }).hasAttribute("disabled"), false);

    fireEvent.click(unsure);
    assert.equal(unsure.getAttribute("aria-pressed"), "true");
    assert.equal(tyt.getAttribute("aria-pressed"), "false");
    assert.equal(ayt.getAttribute("aria-pressed"), "false");
    assert.equal(ydt.getAttribute("aria-pressed"), "false");

    fireEvent.click(tyt);
    assert.equal(tyt.getAttribute("aria-pressed"), "true");
    assert.equal(unsure.getAttribute("aria-pressed"), "false");
  });

  it("persists real stage and client-only area answers in the draft", async () => {
    renderWizard();
    fireEvent.click(await screen.findByRole("radio", { name: "YKS" }));
    await clickContinue();
    fireEvent.click(await screen.findByRole("radio", { name: "Mezun" }));
    await clickContinue();
    fireEvent.click(await screen.findByRole("button", { name: /TYT Temel Yeterlilik/ }));

    await waitFor(() => {
      const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "{}");
      assert.equal(draft.answers.stage, "graduate");
      assert.deepEqual(draft.client.yks_alan, ["TYT"]);
      assert.equal("yks_alan" in draft.answers, false);
    });
  });

  it("uses browser history for in-flow back navigation", async () => {
    renderWizard();
    fireEvent.click(await screen.findByRole("radio", { name: "DGS" }));
    await clickContinue();
    await screen.findByRole("heading", { name: "Şu an hangi aşamadasın?" });

    fireEvent.click(screen.getByRole("button", { name: "Geri" }));
    assert.ok(routerCalls.some((call) => call.method === "back"));
  });

  it("does not render the removed development switcher", async () => {
    renderWizard();
    await screen.findByRole("radio", { name: "YKS" });
    assert.equal(screen.queryByText("Geliştirme görünümü"), null);
    assert.equal(screen.queryByText("Hedef seçimi (geçici)"), null);
  });

  it("leaves for the home page from the first step instead of going nowhere", async () => {
    renderWizard();
    await screen.findByRole("heading", { level: 1 });

    fireEvent.click(screen.getByRole("button", { name: "Çıkış" }));

    assert.ok(routerCalls.some((call) => call.method === "push" && call.href === "/home"));
  });

  it("opens the exit dialog from the header control", async () => {
    renderWizard();
    await screen.findByRole("heading", { level: 1 });

    fireEvent.click(screen.getByRole("button", { name: "Eşleşmeden çık" }));

    const dialog = await screen.findByRole("dialog");
    assert.ok(dialog.textContent?.includes("Eşleşmeden çıkmak istiyor musun?"));
    assert.ok(screen.getByRole("button", { name: "Çık" }));
    assert.ok(screen.getByRole("button", { name: "Devam et" }));
  });
});

describe("draft resume", () => {
  function seedDraft() {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        meta: { schemaVersion: 1, userId: "student-1", createdAt: NOW, updatedAt: NOW },
        answers: { goal: "DGS", stage: "ongoing" },
        client: {},
        stepId: "dersler",
        expiresAt: NOW + 60_000,
      })
    );
  }

  it("offers to resume an unfinished draft", async () => {
    seedDraft();
    renderWizard();

    const dialog = await screen.findByRole("dialog");
    assert.ok(dialog.textContent?.includes("Yarım kalmış bir eşleşmen var"));
  });

  it("resumes at the stored step", async () => {
    seedDraft();
    renderWizard();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Kaldığın yerden devam et" }));

    await waitFor(() =>
      assert.equal(
        screen.getByRole("heading", { level: 1 }).textContent,
        "Hangi derslerde desteğe ihtiyacın var?"
      )
    );
    assert.ok(screen.getAllByText("3 / 8").length > 0);
  });

  it("restarts from the first step and clears only its own draft", async () => {
    seedDraft();
    window.localStorage.setItem(LEGACY_KEY, "legacy-untouched");
    renderWizard();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Baştan başla" }));

    await waitFor(() =>
      assert.equal(
        screen.getByRole("heading", { level: 1 }).textContent,
        "Hangi sınava hazırlanıyorsun?"
      )
    );
    // The legacy /match draft must survive untouched until that flow is retired.
    assert.equal(window.localStorage.getItem(LEGACY_KEY), "legacy-untouched");
  });

  it("never rewrites the legacy key while copying from it", async () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        answers: { goal: "KPSS", stage: "ongoing" },
        step: 2,
        expiresAt: NOW + 60_000,
      })
    );
    const before = window.localStorage.getItem(LEGACY_KEY);

    renderWizard();
    await screen.findByRole("heading", { level: 1 });

    assert.equal(window.localStorage.getItem(LEGACY_KEY), before);
  });
});

describe("P3B question screens", () => {
  it("renders supplied subjects with real counts and blocks a fourth persisted selection", async () => {
    renderWizard();
    await reachDgsSubjects();

    assert.ok(screen.getByRole("button", { name: "Matematik 9 hoca" }));
    assert.equal(screen.queryByRole("button", { name: /Kimya/ }), null);
    for (const name of ["Matematik 9 hoca", "Edebiyat 4 hoca", "İngilizce 3 hoca"]) {
      fireEvent.click(screen.getByRole("button", { name }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Fizik 2 hoca" }));
    assert.equal(screen.getByRole("button", { name: "Fizik 2 hoca" }).getAttribute("aria-pressed"), "false");
    assert.equal(screen.getByRole("alert").textContent, "En fazla üç ders seçebilirsin.");

    await waitFor(() => {
      const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "{}");
      assert.deepEqual(draft.answers.subject_keys, ["matematik", "edebiyat", "ingilizce"]);
    });
    assert.ok(queryCalls.some((call) => call.subjectKeys.length === 3));
  });

  it("filters YKS subjects by the selected area union and keeps unsure broad", async () => {
    renderWizard();
    await continueWith("YKS");
    await continueWith("12. sınıf");
    fireEvent.click(await screen.findByRole("button", { name: /TYT Temel Yeterlilik/ }));
    fireEvent.click(screen.getByRole("button", { name: /YDT Yabancı Dil/ }));
    await clickContinue();

    await screen.findByRole("button", { name: "Matematik 9 hoca" });
    assert.ok(screen.getByRole("button", { name: "İngilizce 3 hoca" }));
    assert.ok(screen.getByRole("button", { name: "Fizik 2 hoca" }));
    assert.equal(screen.queryByRole("button", { name: "Edebiyat 4 hoca" }), null);
  });

  it("moves through challenge, teaching-style, availability and real budget screens", async () => {
    renderWizard();
    await reachDgsSubjects();
    fireEvent.click(screen.getByRole("button", { name: "Matematik 9 hoca" }));
    await clickContinue();

    await screen.findByRole("heading", { name: "Şu an seni en çok ne zorluyor?" });
    fireEvent.click(screen.getByRole("button", { name: "Konu temellerim eksik" }));
    await clickContinue();

    await screen.findByRole("heading", { name: "Nasıl bir hoca sana daha iyi gelir?" });
    fireEvent.click(screen.getByRole("button", { name: /Sabırla temelden anlatan Konuyu adım adım kurar/ }));
    await clickContinue();

    await screen.findByRole("heading", { name: "Dersleri genellikle ne zaman yapabilirsin?" });
    assert.equal(screen.getByRole("alert").textContent, "Devam etmek için en az bir zaman aralığı seç.");
    const flexible = screen.getByRole("button", { name: "Programım esnek" });
    const evening = screen.getByRole("button", { name: "Hafta içi akşam" });
    fireEvent.click(flexible);
    fireEvent.click(evening);
    assert.equal(flexible.getAttribute("aria-pressed"), "false");
    assert.equal(evening.getAttribute("aria-pressed"), "true");
    assert.equal(screen.queryByText("Devam etmek için en az bir zaman aralığı seç."), null);
    await clickContinue();

    await screen.findByRole("heading", { name: "Ders başına bütçen ne kadar?" });
    assert.ok(screen.getByRole("radio", { name: "Ekonomik ₺300’ye kadar / 40 dk" }));
    assert.ok(screen.getByRole("radio", { name: "Dengeli ₺400 – ₺700 / 40 dk" }));
    assert.ok(screen.getByRole("radio", { name: "Premium ₺900 ve üzeri / 40 dk" }));
    assert.equal(screen.getByRole("button", { name: /Devam et/ }).hasAttribute("disabled"), true);
    fireEvent.click(screen.getByRole("radio", { name: /Dengeli/ }));
    assert.equal(screen.getByRole("button", { name: /Devam et/ }).hasAttribute("disabled"), false);
  });

  it("shows a navigable empty state instead of fabricating subjects", async () => {
    currentOptions = { ...options, subjects: options.subjects.map((subject) => ({ ...subject, tutor_count: 0 })) };
    renderWizard();
    await reachDgsSubjects();
    assert.ok(screen.getByText("Bu hedef için şu anda uygun ders bulunamadı."));
    fireEvent.click(screen.getByRole("button", { name: "Hedefimi değiştir" }));
    await screen.findByRole("heading", { name: "Hangi sınava hazırlanıyorsun?" });
  });
});
