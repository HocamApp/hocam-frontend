import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

import tailwindConfig from "../../tailwind.config";

/*
 * Brand v3 Phase 0 (docs/design/brand-v3/PLAN.md, T0.2): the scoped tokens in
 * globals.css carry BRAND.md §2's values, and the `v3:` variant only applies
 * under [data-brand="v3"].
 */

const CSS = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function block(selector: string): Record<string, string> {
  const start = CSS.indexOf(`${selector} {`);
  assert.ok(start >= 0, `${selector} not found in globals.css`);
  const body = CSS.slice(start, CSS.indexOf("}", start));
  return Object.fromEntries(
    Array.from(body.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm), (m) => [m[1], m[2].trim()]),
  );
}

describe("brand v3 tokens", () => {
  it("sets BRAND.md §2's light values inside [data-brand=\"v3\"]", () => {
    const v3 = block('[data-brand="v3"]');
    assert.deepEqual(
      {
        "--pink": v3["--pink"],
        "--pink-deep": v3["--pink-deep"],
        "--pink-soft": v3["--pink-soft"],
        "--yellow": v3["--yellow"],
        "--yellow-soft": v3["--yellow-soft"],
        "--ink": v3["--ink"],
        "--on-accent": v3["--on-accent"],
        "--band": v3["--band"],
        "--on-band": v3["--on-band"],
        "--on-band-mid": v3["--on-band-mid"],
        "--on-band-quiet": v3["--on-band-quiet"],
      },
      {
        "--pink": "#ff2070",
        "--pink-deep": "#e0105e",
        "--pink-soft": "#ffe3ee",
        "--yellow": "#fcff1a",
        "--yellow-soft": "#fdffc7",
        "--ink": "#0c0e09",
        "--on-accent": "#0c0e09",
        "--band": "#0c0e09",
        "--on-band": "#fbf6f6",
        "--on-band-mid": "rgb(251 246 246 / 70%)",
        "--on-band-quiet": "rgb(251 246 246 / 14%)",
      },
    );
  });

  it("aliases the legacy names to the v3 tokens inside the scope", () => {
    const v3 = block('[data-brand="v3"]');
    assert.equal(v3["--pink-pale"], "var(--pink-soft)");
    assert.equal(v3["--gold"], "var(--yellow)");
    assert.equal(v3["--gold-ink"], "var(--on-accent)");
  });

  it("sets the dark starting values and gives --ink back to the dark theme", () => {
    const dark = block('.dark [data-brand="v3"]');
    assert.deepEqual(dark, {
      "--ink": "#ece6e6",
      "--pink-soft": "#3d2231",
      "--pink-pale": "#ffe3ee",
      "--yellow-soft": "#384123",
      "--band": "#1d282b",
      "--on-band": "#ece6e6",
    });
    assert.equal(block(".dark")["--ink"], dark["--ink"]);
  });

  it("keeps --pink-pale light in dark, as outside the scope, with the v3 hue", () => {
    // Today's pink-pale surfaces carry --ink-on-light, which stays black.
    assert.equal(block(":root")["--pink-pale"], "#fce5f1");
    assert.equal(block(".dark")["--pink-pale"], undefined);
    assert.equal(block('.dark [data-brand="v3"]')["--pink-pale"], block('[data-brand="v3"]')["--pink-soft"]);
  });

  it("leaves the tokens v3 does not change out of the scope", () => {
    const v3 = block('[data-brand="v3"]');
    for (const name of ["--paper", "--surface", "--line", "--ink-mid", "--success", "--error"]) {
      assert.equal(v3[name], undefined, name);
    }
  });
});

describe("tailwind brand v3 colours and variant", () => {
  async function compile(html: string) {
    const result = await postcss([
      tailwindcss({ ...tailwindConfig, content: [{ raw: html, extension: "html" }] }),
    ]).process("@tailwind utilities;", { from: undefined });
    return result.css.replace(/\s+/g, " ");
  }

  it("maps the new colour names to their tokens", async () => {
    const css = await compile(
      '<div class="bg-yellow-soft bg-yellow bg-pink-soft bg-band text-on-band text-on-band-mid bg-on-band-quiet text-on-accent">',
    );
    for (const [cls, token] of [
      ["bg-yellow-soft", "--yellow-soft"],
      ["bg-yellow", "--yellow"],
      ["bg-pink-soft", "--pink-soft"],
      ["bg-band", "--band"],
      ["text-on-band", "--on-band"],
      ["text-on-band-mid", "--on-band-mid"],
      ["bg-on-band-quiet", "--on-band-quiet"],
      ["text-on-accent", "--on-accent"],
    ]) {
      assert.match(css, new RegExp(`\\.${cls} \\{[^}]*var\\(${token}\\)`), cls);
    }
  });

  it("keeps Tailwind's own black and yellow scale", async () => {
    const css = await compile('<div class="bg-black/50 bg-yellow-500">');
    assert.match(css, /\.bg-black\\\/50 \{/);
    assert.match(css, /\.bg-yellow-500 \{/);
  });

  it("scopes v3: classes to a [data-brand=\"v3\"] ancestor", async () => {
    const css = await compile('<div class="v3:bg-pink-soft">');
    assert.match(css, /\[data-brand="v3"\] \.v3\\:bg-pink-soft \{[^}]*var\(--pink-soft\)/);
    assert.doesNotMatch(css, /(^|\} )\.v3\\:bg-pink-soft \{/);
  });
});
