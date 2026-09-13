import "@/test/setupDom";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import StatusBadge from "./StatusBadge";

type StatusType = "booking" | "lessonRequest" | "packagePurchase";

const CASES: Array<{
  type: StatusType;
  status: string;
  label: string;
  classes: string[];
  background: string;
  foreground: string;
}> = [
  { type: "booking", status: "pending", label: "Hoca onayı bekleniyor", classes: ["border-ink", "bg-ink", "text-paper"], background: "ink", foreground: "paper" },
  { type: "booking", status: "awaiting_confirmation", label: "Ders onayınızı bekliyor", classes: ["border-ink", "bg-ink", "text-paper"], background: "ink", foreground: "paper" },
  { type: "booking", status: "confirmed", label: "Ders kesinleşti", classes: ["border-gold", "bg-gold", "text-gold-ink"], background: "gold", foreground: "gold-ink" },
  { type: "booking", status: "in_progress", label: "Ders başladı", classes: ["border-pink", "bg-pink", "text-[var(--ink-on-light)]"], background: "pink", foreground: "ink-on-light" },
  { type: "booking", status: "completed", label: "Ders tamamlandı", classes: ["border-success", "bg-success-soft", "text-ink"], background: "success-soft", foreground: "ink" },
  { type: "booking", status: "disputed", label: "İnceleme devam ediyor", classes: ["border-error", "bg-error", "text-white"], background: "error", foreground: "white" },
  { type: "booking", status: "cancelled", label: "Ders iptal edildi", classes: ["border-error", "bg-error", "text-white"], background: "error", foreground: "white" },
  { type: "booking", status: "expired", label: "Otomatik iptal edildi", classes: ["border-error", "bg-error", "text-white"], background: "error", foreground: "white" },
  { type: "lessonRequest", status: "pending", label: "Beklemede", classes: ["border-ink", "bg-ink", "text-paper"], background: "ink", foreground: "paper" },
  { type: "lessonRequest", status: "accepted", label: "Kabul Edildi", classes: ["border-success", "bg-success-soft", "text-ink"], background: "success-soft", foreground: "ink" },
  { type: "lessonRequest", status: "declined", label: "Reddedildi", classes: ["border-error", "bg-error", "text-white"], background: "error", foreground: "white" },
  { type: "packagePurchase", status: "pending", label: "İnceleme bekliyor", classes: ["border-ink", "bg-ink", "text-paper"], background: "ink", foreground: "paper" },
  { type: "packagePurchase", status: "paid", label: "Aktif", classes: ["border-success", "bg-success-soft", "text-ink"], background: "success-soft", foreground: "ink" },
  { type: "packagePurchase", status: "cancelled", label: "İptal edildi", classes: ["border-error", "bg-error", "text-white"], background: "error", foreground: "white" },
  { type: "packagePurchase", status: "refunded", label: "İade edildi", classes: ["border-line", "bg-paper", "text-ink-mid"], background: "paper", foreground: "ink-mid" },
  { type: "booking", status: "manual_review", label: "manual_review", classes: ["border-line", "bg-paper", "text-ink-mid"], background: "paper", foreground: "ink-mid" },
];

afterEach(cleanup);

function renderedBadge(item: (typeof CASES)[number]): HTMLElement {
  render(<StatusBadge type={item.type} status={item.status} />);
  return screen.getByText(item.label);
}

describe("StatusBadge semantics", () => {
  it("preserves every user-facing status label", () => {
    for (const item of CASES) {
      const badge = renderedBadge(item);
      assert.equal(badge.textContent, item.label);
      cleanup();
    }
  });

  it("renders each meaning with the corresponding semantic design tokens", () => {
    for (const item of CASES) {
      const badge = renderedBadge(item);
      for (const className of item.classes) {
        assert.equal(
          badge.classList.contains(className),
          true,
          `${item.type}/${item.status} is missing ${className}`,
        );
      }
      assert.doesNotMatch(
        badge.className,
        /(?:amber|sky|green|orange|red|slate|blue)-/,
        `${item.type}/${item.status} still exposes a raw Tailwind colour`,
      );
      cleanup();
    }
  });
});

const CSS = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

function declarations(selector: ":root" | ".dark"): Record<string, string> {
  const block = CSS.match(
    selector === ":root"
      ? /:root\s*{([\s\S]*?)\n\s*}/
      : /\.dark\s*{([\s\S]*?)\n\s*}/,
  );
  assert.ok(block, `${selector} declarations not found`);
  return Object.fromEntries(
    Array.from(block[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)).map(
      ([, name, value]) => [name, value],
    ),
  );
}

const LIGHT = declarations(":root");
const DARK = { ...LIGHT, ...declarations(".dark") };

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

describe("StatusBadge contrast", () => {
  for (const [theme, palette] of [["light", LIGHT], ["dark", DARK]] as const) {
    it(`keeps every rendered label at WCAG AA contrast in ${theme} theme`, () => {
      for (const item of CASES) {
        const badge = renderedBadge(item);
        assert.equal(
          item.classes.every((className) => badge.classList.contains(className)),
          true,
        );
        const background = item.background === "white" ? "#ffffff" : palette[item.background];
        const foreground = item.foreground === "white" ? "#ffffff" : palette[item.foreground];
        assert.ok(background, `missing ${theme} --${item.background}`);
        assert.ok(foreground, `missing ${theme} --${item.foreground}`);
        const ratio = contrastRatio(background, foreground);
        assert.ok(
          ratio >= 4.5,
          `${theme} ${item.type}/${item.status} contrast is ${ratio.toFixed(2)}:1`,
        );
        cleanup();
      }
    });
  }
});
