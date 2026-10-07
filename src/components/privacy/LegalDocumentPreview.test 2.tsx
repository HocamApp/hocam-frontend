import "@/test/setupDom";

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractLegalDocumentHtml } from "./LegalDocumentPreview";

if (!("DOMParser" in globalThis)) {
  Object.defineProperty(globalThis, "DOMParser", {
    value: window.DOMParser,
    configurable: true,
  });
}

const legalPage = `<!doctype html><html><body>
  <header>Site navbar</header>
  <main id="ys-main-content">
    <div class="grid">
      <nav aria-label="Yasal metinler"><a href="/kvkk">Aydınlatma Metni</a></nav>
      <div class="min-w-0">
        <article class="rounded-card">
          <h1>Aydınlatma Metni</h1>
          <p>Daha önce verdiğin onayları <a href="/profile/gizlilik">Gizlilik ve Verilerim</a> sayfasından yönetebilirsin.</p>
          <script>alert(1)</script>
        </article>
      </div>
    </div>
  </main>
</body></html>`;

describe("extractLegalDocumentHtml", () => {
  it("keeps only the document body, without the legal sidebar", () => {
    const html = extractLegalDocumentHtml(legalPage) ?? "";
    assert.match(html, /<h1>Aydınlatma Metni<\/h1>/);
    assert.doesNotMatch(html, /Yasal metinler/);
    assert.doesNotMatch(html, /Site navbar/);
    assert.doesNotMatch(html, /<script/);
  });

  it("opens links in a new tab so the form behind the sheet survives", () => {
    const html = extractLegalDocumentHtml(legalPage) ?? "";
    assert.match(html, /href="\/profile\/gizlilik" target="_blank" rel="noopener noreferrer"/);
  });

  it("falls back to <main> minus navigation when there is no article", () => {
    const html =
      extractLegalDocumentHtml(
        `<main><nav>Menü</nav><section><h1>Koşullar</h1></section></main>`
      ) ?? "";
    assert.match(html, /<h1>Koşullar<\/h1>/);
    assert.doesNotMatch(html, /Menü/);
  });

  it("reports missing content instead of rendering an empty sheet", () => {
    assert.equal(extractLegalDocumentHtml("<p>No main here</p>"), null);
  });
});
