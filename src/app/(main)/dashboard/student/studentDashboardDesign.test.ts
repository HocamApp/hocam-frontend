import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const source = readFileSync(
  path.join(process.cwd(), "src/app/(main)/dashboard/student/page.tsx"),
  "utf8"
);

describe("student dashboard — DESIGN.md contract", () => {
  it("uses the Hocam canvas, surface, typography and radius tokens", () => {
    for (const token of [
      "bg-paper",
      "bg-surface",
      "border-line",
      "rounded-card",
      "text-ink",
      "text-ink-mid",
      "text-h1-m",
      "text-h2-m",
    ]) {
      assert.ok(source.includes(token), `missing design token: ${token}`);
    }
  });

  it("removes legacy slate, raw brand hex and pure-white page styling", () => {
    assert.equal(/(?:text|bg|border|divide)-slate-/.test(source), false);
    assert.equal(/#[0-9a-fA-F]{6}/.test(source), false);
    assert.equal(source.includes('className="min-h-full bg-white"'), false);
  });

  it("uses Phosphor icons and no emoji or sparkle decoration", () => {
    assert.ok(source.includes('from "@phosphor-icons/react"'));
    assert.equal(source.includes('from "lucide-react"'), false);
    assert.equal(source.includes("👋"), false);
    assert.equal(source.includes("Sparkles"), false);
  });

  it("does not add false elevation or transform-based hover motion", () => {
    assert.equal(/shadow-(?:sm|md|lg|xl|2xl)/.test(source), false);
    assert.equal(/group-hover:(?:translate|scale|rotate)/.test(source), false);
  });

  it("keeps the pending-package icon legible on its fixed light surface in Night mode", () => {
    assert.match(
      source,
      /rounded-input bg-ink text-white dark:bg-\[var\(--ink-on-light\)\]/,
    );
  });

  it("keeps every dashboard action and data-backed surface", () => {
    for (const behavior of [
      '<Link href="/profile/lessons?tab=upcoming">Dersi görüntüle</Link>',
      "booking.conversation_id",
      '<Link href="/profile/lessons">',
      'href="/profile/lessons?tab=history"',
      'href="/profile/payments"',
      "<PackageLearningDetailsSheet",
      "<LessonMaterialsDialog",
      "<LessonConfirmDisputeCard",
    ]) {
      assert.ok(source.includes(behavior), `missing dashboard behavior: ${behavior}`);
    }
  });
});
