import "@/test/setupDom";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import type { PackagePlan } from "@/types/api";

import { YsTodoGate } from "./YsFact";
import { YsGuarantees } from "./YsGuarantees";
import { guarantees, parents, pricing, students } from "./ysHomeCopy";
import { TODO } from "./ysHomeFacts";
import { YsParentsPanel } from "./YsParentsPanel";
import { examplePlans } from "./YsPricing";
import { YsStepList } from "./YsStepList";

// next/link schedules prefetches through `self.requestIdleCallback`.
Object.defineProperty(globalThis, "self", { value: window, configurable: true });

afterEach(cleanup);

function plan(id: string, lessons_per_week: number | null, duration_days: number | null): PackagePlan {
  return {
    id,
    name: id,
    code: null,
    lesson_count: (lessons_per_week ?? 0) * 4,
    lesson_duration_minutes: 40,
    lessons_per_week,
    duration_days,
    discount_percent: 0,
    is_active: true,
    created_at: "",
    updated_at: "",
  };
}

describe("pricing example plans", () => {
  it("keeps the 2-a-week matrix plans, shortest first", () => {
    const plans = examplePlans([
      plan("a", 2, 180),
      plan("b", 3, 30),
      plan("c", 2, 14),
      plan("legacy", null, null),
      plan("d", 2, 90),
    ]);
    assert.deepEqual(plans.map((p) => p.id), ["c", "d", "a"]);
  });

  it("is empty when the call returned nothing", () => {
    assert.deepEqual(examplePlans(undefined), []);
  });
});

describe("student steps", () => {
  it("lists seven steps, every body visible", () => {
    const { container } = render(
      <YsStepList
        steps={students.steps.map((step) => ({
          title: step.title,
          body: step.body({
            trialMinutes: 20,
            trialLimit: 3,
            weeklyMin: 2,
            weeklyMax: 6,
            shortestPlan: "2 hafta",
            longestPlan: "6 ay",
            paymentChargedWhen: null,
            remainingOnSwitch: null,
          }),
        }))}
      />,
    );
    const items = container.querySelectorAll("li");
    assert.equal(items.length, 7);
    assert.equal(container.querySelectorAll("li p").length, 7);
    assert.match(items[2].textContent ?? "", /20 dakikalık/);
    assert.match(items[2].textContent ?? "", /en fazla 3 deneme/);
    assert.match(items[3].textContent ?? "", /Haftada 2 ile 6 ders/);
    assert.match(items[3].textContent ?? "", /2 hafta ile 6 ay/);
    assert.match(items[0].textContent ?? "", /^01\./);
  });
});

describe("guarantees", () => {
  it("quotes the enforced free-cancellation window and links the policy", () => {
    const { container } = render(<YsGuarantees />);
    assert.match(container.textContent ?? "", /Dersten 12 saat öncesine kadar ücretsiz/);
    assert.ok(container.querySelector('a[href="/iptal-ve-iade"]'));
    assert.equal(container.querySelectorAll("h3").length, 4);
  });

  it("marks the undecided answers instead of inventing them", () => {
    const { container } = render(<YsGuarantees />);
    for (const label of ["Ödeme anı: ödeme sağlayıcısı canlıya alınınca", "D6"]) {
      assert.ok(container.querySelector(`[data-todo-fact="${label}"]`), label);
    }
  });
});

describe("parents panel", () => {
  it("anchors at #veliler and links to /veliler", () => {
    const { container } = render(<YsParentsPanel />);
    assert.ok(container.querySelector("section#veliler"));
    assert.ok(container.querySelector('a[href="/veliler"]'));
    assert.equal(container.querySelectorAll("h3").length, 4);
  });
});

describe("YsTodoGate", () => {
  it("shows the sentence once the fact is decided", () => {
    const { container } = render(<YsTodoGate value={20} label="D3">yes</YsTodoGate>);
    assert.equal(container.textContent, "yes");
  });

  it("marks the sentence outside production while the fact is TODO", () => {
    const { container } = render(<YsTodoGate value={TODO} label="D3">yes</YsTodoGate>);
    assert.equal(container.textContent, "yes [D3]");
  });
});

describe("Phase B components keep text in the copy file", () => {
  const strings = (value: unknown): string[] =>
    typeof value === "string"
      ? [value]
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];
  const copyStrings = [students, pricing, guarantees, parents].flatMap(strings);

  for (const file of ["YsHowItWorks.tsx", "YsPricing.tsx", "YsGuarantees.tsx", "YsParentsPanel.tsx", "YsStepList.tsx"]) {
    it(file, () => {
      // The tabbed journey's JOURNEY_STEPS is the flag-off homepage, kept as
      // it is on main; only the rebuilt code has to read from the copy file.
      const source = readFileSync(`src/components/yemeksepeti/${file}`, "utf8")
        .replace(/const JOURNEY_STEPS[\s\S]*?\n\];/, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      assert.deepEqual(
        copyStrings.filter((text) => source.includes(text)),
        [],
      );
    });
  }
});
