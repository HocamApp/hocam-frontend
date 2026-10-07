import "@/test/setupDom";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup } from "@testing-library/react";

import { pages } from "./ysHomeCopy";
import {
  VERIFICATION_DOCS_DELETE_DAYS_AFTER_APPROVAL,
  VERIFICATION_DOCS_MAX_RETENTION_DAYS,
} from "./ysHomeFacts";

let YsStepsToggle: ComponentType;
let sitemap: () => Promise<{ url: string }[]>;
let BecomeTutorPage: () => unknown;
let ParentsPage: () => unknown;

before(async () => {
  mock.module("@/hooks/useCoachingFlag", {
    namedExports: { useCoachingFlag: () => ({ enabled: false }) },
  });
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("@/lib/seo", {
    namedExports: {
      absoluteUrl: (path = "/") => `https://www.hocamozelders.com${path}`,
      fetchAllPublicTutors: async () => [],
      SITE_NAME: "Hocam",
      SITE_URL: "https://www.hocamozelders.com",
      jsonLdStringify: JSON.stringify,
    },
  });
  ({ YsStepsToggle } = await import("./YsStepsToggle"));
  ({ default: sitemap } = await import("@/app/sitemap"));
  ({ default: BecomeTutorPage } = await import("@/app/(main)/hoca-ol/page"));
  ({ default: ParentsPage } = await import("@/app/(main)/veliler/page"));
});

afterEach(cleanup);

describe("with NEXT_PUBLIC_HOME_V2 off", () => {
  it("keeps /hoca-ol and /veliler out of the sitemap", async () => {
    const urls = (await sitemap()).map((page) => page.url);
    assert.equal(urls.some((url) => url.endsWith("/hoca-ol") || url.endsWith("/veliler")), false);
    assert.ok(urls.some((url) => url.endsWith("/nasil-calisir")));
  });

  it("answers /hoca-ol and /veliler with a 404", () => {
    for (const Page of [BecomeTutorPage, ParentsPage]) {
      assert.throws(() => Page(), (error: Error) => /NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK;404/.test(error.message || String((error as { digest?: string }).digest)));
    }
  });

  it("leaves the current four steps on /nasil-calisir and adds nothing to the verification page", () => {
    const how = readFileSync("src/app/(main)/nasil-calisir/page.tsx", "utf8");
    assert.match(how, /HOME_V2_ENABLED \? \(/);
    assert.match(how, /title="Dört temel adım"/);
    const verification = readFileSync("src/app/(main)/hocalar-nasil-dogrulaniyor/page.tsx", "utf8");
    assert.match(verification, /\{HOME_V2_ENABLED && \(/);
    assert.match(verification, /\.\.\.\(HOME_V2_ENABLED \? rebuildFaqItems\(\) : \[\]\)/);
  });
});

describe("/nasil-calisir steps toggle", () => {
  it("puts both step lists in the server HTML, student first and visible", () => {
    const html = renderToStaticMarkup(<YsStepsToggle />);
    assert.match(html, /Öğrenciyim/);
    assert.match(html, /Hocayım/);
    assert.match(html, /Hocanı bul/);
    assert.match(html, /Doğrulan/);
    assert.match(html, /id="ys-steps-panel-student"[^>]*>/);
    assert.match(html, /id="ys-steps-panel-tutor" aria-labelledby="ys-steps-tab-tutor" hidden=""/);
    assert.equal((html.match(/<li/g) ?? []).length, 14);
  });
});

describe("verification FAQ", () => {
  it("quotes the deletion periods /kvkk/hoca-dogrulama publishes", () => {
    const kvkk = readFileSync("src/app/(main)/(legal)/kvkk/hoca-dogrulama/page.tsx", "utf8");
    assert.match(kvkk, new RegExp(`onaydan sonra ${VERIFICATION_DOCS_DELETE_DAYS_AFTER_APPROVAL} gün içinde silinir`));
    assert.match(kvkk, new RegExp(`belge saklama üst sınırı ${VERIFICATION_DOCS_MAX_RETENTION_DAYS} gündür`));

    const answer = pages.verification.faq.deletion
      .answer(VERIFICATION_DOCS_DELETE_DAYS_AFTER_APPROVAL, VERIFICATION_DOCS_MAX_RETENTION_DAYS, "")
      .join("");
    assert.match(answer, /Ham belgeler ve güvenli önizlemeler onaydan sonra 7 gün içinde silinir\./);
    assert.match(answer, /Reddedilen veya bekleyen başvurularda belge saklama üst sınırı 30 gündür\./);
  });

  it("names the reviewers as /kvkk/hoca-dogrulama does", () => {
    const kvkk = readFileSync("src/app/(main)/(legal)/kvkk/hoca-dogrulama/page.tsx", "utf8").replace(/\s+/g, " ");
    assert.ok(kvkk.includes("yetkiye sahip ve erişimi kaydedilen inceleme personeline açılır"));
    assert.match(pages.verification.faq.reviewer.answer, /yetkiye sahip ve erişimi kaydedilen inceleme personeline açılır/);
  });
});

describe("every Hoca ol link on the rebuilt site goes to /hoca-ol", () => {
  it("hero, footer and tutors band", () => {
    const hero = readFileSync("src/components/yemeksepeti/YsHeroIntro.tsx", "utf8");
    assert.match(hero, /href=\{v2 \? "\/hoca-ol" : "\/register\?role=tutor"\}/);
    const footer = readFileSync("src/components/yemeksepeti/YsFooter.tsx", "utf8");
    assert.match(footer, /label: copy\.links\.becomeTutor, href: "\/hoca-ol"/);
    const band = readFileSync("src/components/yemeksepeti/YsTutorBand.tsx", "utf8");
    assert.equal((band.match(/href="\/hoca-ol"/g) ?? []).length, 2);
  });
});
