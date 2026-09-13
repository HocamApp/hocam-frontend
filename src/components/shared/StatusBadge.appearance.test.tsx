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
  { type: "booking", status: "disputed", label: "İnceleme devam ediyor", classes: ["border-error", "bg-error", "text-destructive-foreground"], background: "error", foreground: "destructive-foreground" },
  { type: "booking", status: "cancelled", label: "Ders iptal edildi", classes: ["border-error", "bg-error", "text-destructive-foreground"], background: "error", foreground: "destructive-foreground" },
  { type: "booking", status: "expired", label: "Otomatik iptal edildi", classes: ["border-error", "bg-error", "text-destructive-foreground"], background: "error", foreground: "destructive-foreground" },
  { type: "lessonRequest", status: "pending", label: "Beklemede", classes: ["border-ink", "bg-ink", "text-paper"], background: "ink", foreground: "paper" },
  { type: "lessonRequest", status: "accepted", label: "Kabul Edildi", classes: ["border-success", "bg-success-soft", "text-ink"], background: "success-soft", foreground: "ink" },
  { type: "lessonRequest", status: "declined", label: "Reddedildi", classes: ["border-error", "bg-error", "text-destructive-foreground"], background: "error", foreground: "destructive-foreground" },
  { type: "packagePurchase", status: "pending", label: "İnceleme bekliyor", classes: ["border-ink", "bg-ink", "text-paper"], background: "ink", foreground: "paper" },
  { type: "packagePurchase", status: "paid", label: "Aktif", classes: ["border-success", "bg-success-soft", "text-ink"], background: "success-soft", foreground: "ink" },
  { type: "packagePurchase", status: "cancelled", label: "İptal edildi", classes: ["border-error", "bg-error", "text-destructive-foreground"], background: "error", foreground: "destructive-foreground" },
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
        /\b(?:text|bg|border)-(?:white|black)\b|(?:amber|sky|green|orange|red|slate|blue)-/,
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
    Array.from(
      block[1].matchAll(
        /--([\w-]+):\s*(#[0-9a-fA-F]{6}|-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?%\s+-?\d+(?:\.\d+)?%)\s*;/g,
      ),
    ).map(
      ([, name, value]) => [name, value],
    ),
  );
}

const LIGHT = declarations(":root");
const DARK = { ...LIGHT, ...declarations(".dark") };

function rgb(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    return [1, 3, 5].map((index) =>
      Number.parseInt(color.slice(index, index + 2), 16),
    ) as [number, number, number];
  }
  const [hue, saturationPercent, lightnessPercent] = color
    .split(/\s+/)
    .map(Number.parseFloat);
  const saturation = saturationPercent / 100;
  const lightness = lightnessPercent / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = ((hue % 360) + 360) % 360 / 60;
  const intermediate = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] = segment < 1
    ? [chroma, intermediate, 0]
    : segment < 2
      ? [intermediate, chroma, 0]
      : segment < 3
        ? [0, chroma, intermediate]
        : segment < 4
          ? [0, intermediate, chroma]
          : segment < 5
            ? [intermediate, 0, chroma]
            : [chroma, 0, intermediate];
  const match = lightness - chroma / 2;
  return [red, green, blue].map((channel) => (channel + match) * 255) as [
    number,
    number,
    number,
  ];
}

function relativeLuminance(color: string): number {
  const [r, g, b] = rgb(color).map((channel) => {
    const value = channel / 255;
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
        const background = palette[item.background];
        const foreground = palette[item.foreground];
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
