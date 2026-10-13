import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { paidPurchase } from "@/test/refundFixtures";
import type { PackagePurchase, PlaceLessonsResult } from "@/types";

type Json = Record<string, unknown>;
const posts: { url: string; body: Json }[] = [];
let postResponse: () => unknown;
let pickerProps: Record<string, unknown> = {};

const ONE_SUBJECT = [{ id: 7, name: "Matematik", exam_type: "TYT" }];

function placed(overrides: Partial<PlaceLessonsResult> = {}) {
  return {
    data: { placed: 4, lessons: [], remaining_credits: 0, skipped_after_term: 0, not_stored: 0, ...overrides },
  };
}

function failure(status: number, data: unknown) {
  return Promise.reject({ isAxiosError: true, response: { status, data } });
}

let Flow: React.ComponentType<{ purchase: PackagePurchase }>;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  // The picker has its own tests; here it is a pair of buttons that choose hours.
  mock.module("@/components/lessons/RecurringLessonSlotPicker", {
    namedExports: {
      RecurringLessonSlotPicker: (props: Record<string, unknown>) => {
        pickerProps = props;
        const onChange = props.onChange as (v: unknown[]) => void;
        return (
          <div>
            <button type="button" onClick={() => onChange([{ day_of_week: 1, start_time: "10:00" }])}>
              Salı 10:00
            </button>
            <button type="button" onClick={() => onChange([])}>
              Seçimi temizle
            </button>
          </div>
        );
      },
    },
  });
  mock.module("@/lib/tutorsApi", { namedExports: { fetchTutorById: async () => ({ subjects: ONE_SUBJECT }) } });
  mock.module("@/lib/api", {
    defaultExport: {
      post: async (url: string, body: Json) => {
        posts.push({ url, body });
        return postResponse();
      },
      get: async (url: string) => {
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ PlaceLessonsFlow: Flow } = await import("./PlaceLessonsFlow"));
});

beforeEach(() => {
  posts.length = 0;
  pickerProps = {};
  postResponse = () => placed();
});

afterEach(cleanup);

function purchase(overrides: Partial<PackagePurchase> = {}) {
  return paidPurchase({
    remaining_credits: 4,
    tutor: { id: "tutor-1", name: "Ada", surname: "Lovelace", subjects: ONE_SUBJECT as never },
    ...overrides,
  });
}

function renderFlow(p: PackagePurchase = purchase()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Flow purchase={p} />
    </QueryClientProvider>
  );
}

const submit = () => screen.getByRole("button", { name: /Hakları yerleştir|Yerleştiriliyor/ }) as HTMLButtonElement;

describe("placing the credits of a package", () => {
  it("asks the picker for hours free every week, as many as the plan has a week, for that term", () => {
    renderFlow();

    assert.equal(pickerProps.lessonsPerWeek, 2);
    assert.equal(pickerProps.requiredCount, 2);
    assert.equal(pickerProps.termDays, 30);
    assert.equal(pickerProps.durationMinutes, 40);
  });

  it("will not go on until hours are chosen, and says so", () => {
    renderFlow();

    assert.equal(submit().disabled, true);
    assert.ok(screen.getByText("En az bir haftalık saat seç."));
    fireEvent.click(submit());
    assert.deepEqual(posts, []);
  });

  it("sends the subject and the chosen hours to this package, once, however many times the button is pressed", async () => {
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Salı 10:00" }));

    fireEvent.click(submit());
    fireEvent.click(submit());

    await screen.findByText("4 ders takvimine eklendi.");
    assert.equal(posts.length, 1);
    assert.equal(posts[0].url, "/payments/package-purchases/purchase-1/place-lessons/");
    assert.deepEqual(posts[0].body, { subject: "7", slots: [{ day_of_week: 1, start_time: "10:00" }] });
    assert.ok(screen.getByText("Bütün haklarını yerleştirdin."));
    assert.equal(screen.getByRole("link", { name: "Derslerimi gör" }).getAttribute("href"), "/dashboard/student");
  });

  it("says plainly which credits did not fit the term and that they are kept", async () => {
    postResponse = () => placed({ placed: 3, remaining_credits: 1, skipped_after_term: 1 });
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Salı 10:00" }));

    fireEvent.click(submit());

    await screen.findByText("3 ders takvimine eklendi.");
    assert.ok(screen.getByText(/1 hakkın paket süresine sığmadığı için yerleşmedi. Hakların duruyor/));
    assert.ok(screen.getByText("Yerleşmemiş 1 ders hakkın kaldı."));
  });

  it("says nothing was changed when the call placed nothing", async () => {
    postResponse = () => placed({ placed: 0, remaining_credits: 0 });
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Salı 10:00" }));

    fireEvent.click(submit());

    await screen.findByText("Yerleştirilecek ders kalmadı; takviminde değişiklik yapılmadı.");
  });

  it("names the day an hour is not free, keeps the chosen hours and adds nothing", async () => {
    postResponse = () =>
      failure(409, {
        code: "schedule_unavailable",
        detail: "x",
        unavailable_date: "2026-11-02",
      });
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Salı 10:00" }));

    fireEvent.click(submit());

    await screen.findByText(/2026-11-02 tarihinde müsait değil/);
    assert.match(document.body.textContent ?? "", /hiçbir ders eklenmedi/);
    // Still on the same screen, still able to try again.
    await waitFor(() => assert.equal(submit().disabled, false));
  });

  it("does not show a package without a weekly plan the picker", () => {
    const base = purchase();
    renderFlow({ ...base, plan: { ...base.plan, lessons_per_week: null } });

    assert.ok(screen.getByText(/haftalık ders programı içermiyor/));
    assert.equal(screen.queryByRole("button", { name: "Salı 10:00" }), null);
  });
});
