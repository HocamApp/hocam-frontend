import "@/test/setupDom";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, before, describe, it, mock } from "node:test";
import React, { type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, render } from "@testing-library/react";

import { TODO } from "./ysHomeFacts";
import { faq, footer, testimonialsTitle, tutors } from "./ysHomeCopy";
import { approvedTestimonials, TESTIMONIALS, type YsTestimonial } from "./ysTestimonialData";

let coachingOn = false;
let pathname = "/";

let YsTutorBand: ComponentType;
let YsFooter: ComponentType<{ v2?: boolean }>;
let YsHomeFaq: ComponentType<{ v2?: boolean }>;
let faqEntries: typeof import("./YsHomeFaq").faqEntries;
let faqAnswerText: typeof import("./YsHomeFaq").faqAnswerText;

before(async () => {
  mock.module("@/hooks/useCoachingFlag", {
    namedExports: { useCoachingFlag: () => ({ enabled: coachingOn }) },
  });
  mock.module("next/navigation", { namedExports: { usePathname: () => pathname } });
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ YsTutorBand } = await import("./YsTutorBand"));
  ({ YsFooter } = await import("./YsFooter"));
  ({ YsHomeFaq, faqEntries, faqAnswerText } = await import("./YsHomeFaq"));
});

afterEach(cleanup);

describe("tutors band", () => {
  it("anchors at #hocalar on ink, links both buttons to /hoca-ol", () => {
    const { container } = render(<YsTutorBand />);
    const band = container.querySelector("section#hocalar")!;
    assert.ok(band);
    assert.match(band.className, /ys-band-ink/);
    assert.match(band.className, /bg-ink/);
    assert.match(band.className, /text-paper/);
    assert.equal(container.querySelectorAll('a[href="/hoca-ol"]').length, 2);
    assert.equal(container.querySelectorAll("ol li").length, 7);
  });

  it("never pairs white text with the ink band", () => {
    const source = readFileSync("src/components/yemeksepeti/YsTutorBand.tsx", "utf8");
    // The only white text is the pink button's.
    assert.deepEqual(
      Array.from(source.matchAll(/className="([^"]*text-white[^"]*)"/g)).map((m) => /bg-pink/.test(m[1])),
      [true],
    );
  });

  it("hides every mention of coaching while the flag is off", () => {
    coachingOn = false;
    const { container } = render(<YsTutorBand />);
    assert.doesNotMatch(container.textContent ?? "", /[Kk]oçlu/);
  });

  it("shows the coaching chip and sentence while the flag is on", () => {
    coachingOn = true;
    const { container } = render(<YsTutorBand />);
    assert.match(container.textContent ?? "", /Büyü, koçluk da ver/);
    assert.match(container.textContent ?? "", /YKS koçluğu da verebilirsin/);
    coachingOn = false;
  });

  it("keeps the calculator off without NEXT_PUBLIC_TUTOR_EARNINGS_PREVIEW", () => {
    const { container } = render(<YsTutorBand />);
    assert.doesNotMatch(container.textContent ?? "", new RegExp(tutors.calculator.title));
    assert.equal(container.querySelector('input[type="range"]'), null);
  });

  it("never mentions IBAN", () => {
    const { container } = render(<YsTutorBand />);
    assert.doesNotMatch(container.textContent ?? "", /IBAN/i);
  });
});

describe("testimonials", () => {
  it("drops Bahadir and starts every entry unapproved", () => {
    assert.equal(TESTIMONIALS.some((entry) => entry.name === "Bahadir"), false);
    assert.equal(TESTIMONIALS.every((entry) => entry.approved === false), true);
  });

  it("returns only approved entries of the asked role", () => {
    const entries: YsTestimonial[] = [
      { ...TESTIMONIALS[0], id: "a", role: "tutor", approved: true },
      { ...TESTIMONIALS[0], id: "b", role: "tutor", approved: false },
      { ...TESTIMONIALS[0], id: "c", role: "student", approved: true },
    ];
    assert.deepEqual(approvedTestimonials("tutor", entries).map((e) => e.id), ["a"]);
    assert.deepEqual(approvedTestimonials("student", entries).map((e) => e.id), ["c"]);
  });
});

describe("FAQ", () => {
  it("puts every answer of every tab in the server HTML", () => {
    const html = renderToStaticMarkup(<YsHomeFaq v2 />);
    for (const audience of ["student", "parent", "tutor"] as const) {
      for (const entry of faqEntries(audience, false)) {
        const text = entry.answer.find((part): part is string => typeof part === "string") ?? "";
        const firstSentence = text.split(".")[0].trim().replace(/'/g, "&#x27;");
        if (firstSentence) assert.ok(html.includes(firstSentence), `${entry.id}: ${firstSentence}`);
      }
    }
    assert.match(html, /<details/);
    assert.match(html, /role="tablist"/);
  });

  it("renders every decided answer in production and the JSON-LD, and skips the tax question", () => {
    for (const audience of ["student", "parent", "tutor"] as const) {
      const dev = faqEntries(audience, false);
      assert.ok(dev.length > 0, audience);
      assert.ok(dev.every((entry) => !entry.pending), audience);
      assert.deepEqual(faqEntries(audience, true), dev, audience);
    }
    assert.ok(!faqEntries("tutor", false).some((entry) => entry.id === "hoca-vergi"));

    const html = renderToStaticMarkup(<YsHomeFaq v2 />);
    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "";
    const questions = (JSON.parse(jsonLd.replace(/\\u003c/g, "<")).mainEntity as { name: string }[]).map((q) => q.name);
    assert.ok(questions.includes("Tek ders satın alabilir miyim?"));
    assert.ok(questions.includes("Ödemeyi ben yapabilir miyim?"));
    assert.ok(!questions.includes("Kazancımı vergi açısından nasıl beyan ederim?"));
  });

  it("states the single-lesson answer from the package facts", () => {
    const entry = faqEntries("student", true).find((item) => item.id === "tek-ders")!;
    assert.equal(
      faqAnswerText(entry.answer),
      "Hayır. Dersler haftalık paketle alınır: haftada 2 ile 6 ders, 2 hafta ile 6 ay arası.",
    );
  });

  it("flattens facts and links to plain text", () => {
    assert.equal(
      faqAnswerText(["a ", { fact: 3, label: "x" }, " ", { href: "/y", text: "b" }]),
      "a 3 b",
    );
    assert.equal(faqEntries("tutor", false).some((e) => e.answer.some((p) => typeof p === "object" && "fact" in p && p.fact === TODO)), false);
  });
});

describe("footer v2", () => {
  it("has the five columns, the audience links and no store badges", () => {
    pathname = "/";
    const html = renderToStaticMarkup(<YsFooter v2 />);
    for (const heading of Object.values(footer.columns)) {
      assert.ok(html.includes(heading.replace(/'/g, "&#x27;")), heading);
    }
    assert.match(html, /href="\/#fiyatlar"/);
    assert.match(html, /href="\/#ogrenciler"/);
    assert.match(html, /href="\/veliler"/);
    assert.match(html, /href="\/hoca-ol"/);
    assert.match(html, /href="\/hakkimizda-v2"/);
    assert.match(html, /Mobil uygulama yakında/);
    assert.doesNotMatch(html, /App Store|Google Play/);
    assert.match(html, /KVKK başvuru: iletisim@hocamozelders.com/);
  });

  it("keeps the current footer with the flag off", () => {
    pathname = "/";
    const html = renderToStaticMarkup(<YsFooter v2={false} />);
    assert.match(html, /Hocam mobilde/);
    assert.match(html, /href="\/register\?role=tutor"/);
    assert.doesNotMatch(html, /Kimin için\?/);
  });
});

describe("Phase C components keep text in the copy file", () => {
  const strings = (value: unknown): string[] =>
    typeof value === "string"
      ? [value]
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];
  const copyStrings = [tutors, faq, footer, testimonialsTitle].flatMap(strings);

  for (const file of ["YsTutorBand.tsx", "YsEarningsCalculator.tsx"]) {
    it(file, () => {
      const source = readFileSync(`src/components/yemeksepeti/${file}`, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      assert.deepEqual(copyStrings.filter((text) => source.includes(text)), []);
    });
  }
});
