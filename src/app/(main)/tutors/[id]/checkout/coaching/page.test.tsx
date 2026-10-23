import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let search = "";
let eligibility: unknown;
let eligibilityStatus: number | null = null;
const replaced: string[] = [];
const goalPatches: unknown[] = [];

const tutor = {
  id: "tutor-1",
  name: "Elif",
  surname: "Kaya",
  university: "ITU",
  department: "Matematik",
  profile_picture: "",
  hourly_price: 400,
  offers_coaching: true,
  subjects: [{ id: 7, name: "Matematik", exam_type: "TYT" }],
};

const plan = {
  frequency: "weekly",
  session_duration_minutes: 30,
  price_per_session_minor: 40000,
  price_per_session_display: "400,00 ₺",
  is_free: false,
  target_exam_types: ["YKS"],
  description: "Her görüşmede deneme sonuçlarına bakıp programı birlikte güncelliyoruz.",
};

let Page: React.ComponentType<{ params: { id: string } }>;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push() {}, replace: (url: string) => replaced.push(url), back() {} }),
      usePathname: () => "/tutors/tutor-1/checkout/coaching",
      useSearchParams: () => new URLSearchParams(search),
    },
  });
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student", email: "deniz@example.com" },
        isAuthenticated: true,
        isStudent: true,
        isTutor: false,
        isAdmin: false,
        isImpersonating: false,
        isLoading: false,
      }),
    },
  });
  mock.module("@/hooks/useCoachingFlag", {
    namedExports: { useCoachingFlag: () => ({ checkoutEnabled: true, isLoading: false }) },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/tutors/tutor-1/") return { data: tutor };
        if (url === "/coaching/eligibility/") {
          if (eligibilityStatus) throw Object.assign(new Error("no"), { response: { status: eligibilityStatus } });
          return { data: eligibility };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      patch: async (url: string, body: unknown) => {
        if (url !== "/matching/goal/") throw new Error(`unexpected PATCH ${url}`);
        goalPatches.push(body);
        return { data: body };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  search = "per_week=3&duration=90&schedule=7~0:10:00,2:10:00,4:18:00";
  eligibility = { eligible: true, reason: "ok", message: "", plan };
  eligibilityStatus = null;
  replaced.length = 0;
  goalPatches.length = 0;
});

afterEach(() => cleanup());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page params={{ id: "tutor-1" }} />
    </QueryClientProvider>
  );
}

const paramsOf = (name: string) => {
  const href = screen.getByRole("link", { name }).getAttribute("href") ?? "";
  return { path: href.split("?")[0], params: new URLSearchParams(href.split("?")[1] ?? "") };
};

describe("the coaching step of checkout", () => {
  it("opens on one offer card that is not chosen, with the way past it under the card", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Çalışma Koçluğu", level: 1 });
    assert.ok(screen.getByText("Ders paketine çalışma koçluğu eklemek ister misin? Bu adımı atlayabilirsin."));
    assert.ok(await screen.findByRole("button", { name: "Koçluk ekle" }));
    assert.equal(screen.queryByText("Seçili"), null);
    assert.equal(screen.queryByRole("link", { name: "Paket seçeneklerine devam et" }), null);

    const skip = paramsOf("Koçluk olmadan devam et");
    assert.equal(skip.path, "/tutors/tutor-1/checkout");
    assert.equal(skip.params.get("coaching"), null);
    assert.equal(skip.params.get("per_week"), "3");
    assert.equal(skip.params.get("duration"), "90");
    assert.equal(skip.params.get("schedule"), "7~0:10:00,2:10:00,4:18:00");
  });

  it("has no summary column any more: the lesson price was not part of this decision", async () => {
    renderPage();
    await screen.findByRole("button", { name: "Koçluk ekle" });

    const text = document.body.textContent ?? "";
    assert.doesNotMatch(text, /Ders fiyatı/);
    assert.equal(screen.queryByRole("heading", { name: "Özet" }), null);
  });

  it("opens a strip under the card once coaching is added, naming the package, and carries coaching=1 on", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Koçluk ekle" }));

    assert.ok(screen.getByText("Seçili"));
    assert.ok(screen.getByText("Haftada 3 ders · 3 ay + koçluk"));
    const next = paramsOf("Paket seçeneklerine devam et");
    assert.equal(next.path, "/tutors/tutor-1/checkout");
    assert.equal(next.params.get("coaching"), "1");
    assert.equal(next.params.get("per_week"), "3");
    assert.equal(next.params.get("schedule"), "7~0:10:00,2:10:00,4:18:00");
    // The way past stays, and still leaves coaching out.
    assert.equal(paramsOf("Koçluk olmadan devam et").params.get("coaching"), null);
  });

  it("takes the choice back, and the strip with it", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Koçluk ekle" }));
    fireEvent.click(screen.getByRole("button", { name: "Koçluğu kaldır" }));

    assert.equal(screen.queryByText("Seçili"), null);
    assert.equal(screen.queryByRole("link", { name: "Paket seçeneklerine devam et" }), null);
    assert.ok(screen.getByRole("button", { name: "Koçluk ekle" }));
  });

  it("comes back chosen when the checkout's edit link brings coaching=1 along", async () => {
    search += "&coaching=1";
    renderPage();

    assert.ok(await screen.findByText("Seçili"));
    assert.ok(screen.getByRole("link", { name: "Paket seçeneklerine devam et" }));
    assert.ok(screen.getByRole("button", { name: "Koçluğu kaldır" }));
  });

  it("names only the package it was told about", async () => {
    search = "coaching=1";
    renderPage();

    await screen.findByText("Seçili");
    assert.ok(screen.getByText("Ders paketin + koçluk"));
  });

  it("keeps how it works shut until it is opened, with today's six lines", async () => {
    renderPage();
    const trigger = await screen.findByRole("button", { name: "Koçluk nasıl çalışır?" });

    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    assert.equal(screen.queryByText("Bütün koçluk görüşmeleri 30 dakikadır."), null);
    fireEvent.click(trigger);
    assert.ok(await screen.findByText("Bütün koçluk görüşmeleri 30 dakikadır."));
    assert.equal(document.querySelectorAll("[data-state='open'] ul li").length >= 6, true);
  });

  it("still asks for an exam target first when the server says it is missing, and saves it in place", async () => {
    eligibility = { eligible: false, reason: "missing_target_exam", message: "", plan, available_exam_targets: ["YKS", "DGS"] };
    renderPage();

    assert.ok(await screen.findByText("Sınav hedefini seç"));
    assert.equal(screen.queryByRole("button", { name: "Koçluk ekle" }), null);
    fireEvent.click(screen.getByRole("button", { name: "DGS" }));
    await waitFor(() => assert.deepEqual(goalPatches, [{ goal: "DGS" }]));
  });

  it("skips the step when the tutor has no plan the student can use", async () => {
    eligibility = { eligible: false, reason: "no_plan", message: "", plan: null };
    renderPage();

    await waitFor(() => assert.equal(replaced.length, 1));
    assert.equal(replaced[0].startsWith("/tutors/tutor-1/checkout?"), true);
    assert.equal(screen.queryByRole("button", { name: "Koçluk ekle" }), null);
  });

  it("does not call a link's coaching=1 a choice when the server no longer lets her take it", async () => {
    search += "&coaching=1";
    eligibility = { eligible: false, reason: "capacity_full", message: "Bu hocanın koçluk kontenjanı şu anda dolu.", plan };
    renderPage();

    assert.ok(await screen.findByText("Bu hocanın koçluk kontenjanı şu anda dolu."));
    assert.equal(screen.queryByText("Seçili"), null);
    assert.equal(screen.queryByRole("link", { name: "Paket seçeneklerine devam et" }), null);
    assert.equal(paramsOf("Koçluk olmadan devam et").params.get("coaching"), null);
  });

  it("uses the global tokens: the checkout palette variables are not loaded on this route", async () => {
    renderPage();
    await screen.findByRole("button", { name: "Koçluk ekle" });
    assert.doesNotMatch(document.body.innerHTML, /--checkout-/);
  });
});
