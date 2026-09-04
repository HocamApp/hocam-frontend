import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  LEGAL_DOCUMENTS,
  getLegalDocument,
  legalNavLabel,
  legalPageMetadata,
} from "./legalDocuments";

const APP_DIR = path.join(process.cwd(), "src", "app");

/** Where the router would look for a page serving `href`. */
function routeFileFor(href: string) {
  const segments = href.replace(/^\//, "").split("/");
  return path.join(APP_DIR, "(main)", "(legal)", ...segments, "page.tsx");
}

describe("legal document registry", () => {
  it("gives every document a unique href", () => {
    const hrefs = LEGAL_DOCUMENTS.map((doc) => doc.href);
    assert.equal(new Set(hrefs).size, hrefs.length);
  });

  it("points every entry at a page that actually exists", () => {
    // This is the test that stops a sidebar entry from 404-ing. Renaming a
    // route folder without updating the registry fails here rather than in
    // production.
    for (const doc of LEGAL_DOCUMENTS) {
      assert.ok(
        fs.existsSync(routeFileFor(doc.href)),
        `${doc.slug} has no page at ${doc.href}`,
      );
    }
  });

  it("keeps veli-onayi out of the registry", () => {
    // It is a token-gated confirmation flow reached from an email link, not
    // a document. A sidebar, hub or sitemap entry for it would land the
    // reader on an error state.
    const hrefs = LEGAL_DOCUMENTS.map((doc) => doc.href);
    assert.ok(!hrefs.includes("/kvkk/veli-onayi"));
    assert.ok(!fs.existsSync(routeFileFor("/kvkk/veli-onayi")));
  });

  it("has no page of its own at /kvkk", () => {
    // next.config.js redirects /kvkk onto the first document. A page file
    // here would win over the redirect and quietly restore the index.
    assert.ok(!fs.existsSync(routeFileFor("/kvkk")));
  });

  it("keeps the displayed and machine dates in agreement", () => {
    const MONTHS = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
    ];
    for (const doc of LEGAL_DOCUMENTS) {
      if (!doc.updatedAt) {
        assert.equal(doc.updatedAtIso, undefined);
        continue;
      }
      assert.ok(doc.updatedAtIso, `${doc.slug} has a date but no ISO date`);
      const iso = new Date(doc.updatedAtIso);
      assert.ok(!Number.isNaN(iso.getTime()));
      const [day, month, year] = doc.updatedAt.split(" ");
      assert.equal(Number(day), iso.getUTCDate());
      assert.equal(MONTHS[iso.getUTCMonth()], month);
      assert.equal(Number(year), iso.getUTCFullYear());
    }
  });

  it("falls back to the title when a document has no nav label", () => {
    assert.equal(legalNavLabel(getLegalDocument("cerez-politikasi")), "Çerez Politikası");
    assert.equal(legalNavLabel(getLegalDocument("aydinlatma-metni")), "Aydınlatma Metni");
  });

  it("builds metadata with a canonical url", () => {
    const meta = legalPageMetadata("aydinlatma-metni");
    assert.equal(meta.title, "Aydınlatma Metni");
    assert.equal(meta.alternates?.canonical, "/kvkk/aydinlatma-metni");
  });
});
