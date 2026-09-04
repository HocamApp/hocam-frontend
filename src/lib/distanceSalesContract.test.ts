import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Guards the two clauses in /mesafeli-satis-sozlesmesi that a mistake would
 * make expensive.
 *
 * Mesafeli Sözleşmeler Yönetmeliği m.15 only removes the right of withdrawal
 * once performance has begun with the consumer's consent, and only if m.5(h)
 * was satisfied — the consumer must have been told beforehand that consenting
 * costs them the right. Drop that sentence and the 14 days never start, which
 * leaves the right alive for a year.
 */

const PAGE = path.join(
  process.cwd(),
  "src/app/(main)/(legal)/mesafeli-satis-sozlesmesi/page.tsx",
);
const page = fs.readFileSync(PAGE, "utf8");
const prose = page
  .replace(/className="[^"]*"/g, "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\{"\s*"\}/g, " ")
  .replace(/\s+/g, " ");

describe("mesafeli satış sözleşmesi", () => {
  it("grants the 14-day withdrawal right and a 14-day refund window", () => {
    assert.match(prose, /on dört gün içinde hiçbir gerekçe göstermeksizin/);
    assert.match(prose, /on dört gün içinde Alıcının ödeme yaptığı yöntemle iade/);
  });

  it("warns before the right lapses, as m.5(h) requires", () => {
    // Without this notice the withdrawal period never starts running.
    assert.match(prose, /cayma hakkı sona erer/);
    assert.match(prose, /onay vermeden önce bilgilendirilmesi amacıyla/);
  });

  it("keeps the refund policy alive after the right lapses", () => {
    assert.match(prose, /Cayma hakkının sona ermesi, Alıcının iade talebinde bulunma hakkını ortadan kaldırmaz/);
    assert.match(prose, /on beş gün içinde Alıcının ödeme yaptığı yöntemle/);
  });

  it("does not claim the refund policy exceeds the legal minimum", () => {
    // It does not. A weekly lesson package is a periodic service over a fixed
    // term, so refunding the unperformed part is the floor, not a courtesy.
    assert.doesNotMatch(prose, /asgari korumanın ötesinde/);
  });

  it("states the mandatory pre-contract information", () => {
    for (const item of [
      /Satıcının kimliği ve iletişim bilgileri/,
      /Vergiler dahil toplam bedel ve ödeme şekli/,
      /Cayma hakkının kullanım şartları/,
      /Tüketici Hakem Heyeti/,
    ]) {
      assert.match(prose, item);
    }
  });

  it("claims no automatic collection", () => {
    // AI_AGENT_RULES §1: no payment provider is connected.
    assert.match(prose, /otomatik tahsilat yapılmamaktadır/);
    assert.doesNotMatch(prose, /kartınızdan tahsil/);
  });

  it("does not invent a support address", () => {
    assert.doesNotMatch(page, /destek@|kvkk@/);
  });
});
