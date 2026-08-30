import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const promo = readFileSync("src/components/yemeksepeti/YsPromoBanners.tsx", "utf8");
const testimonials = readFileSync("src/components/yemeksepeti/YsTestimonials.tsx", "utf8");
const footer = readFileSync("src/components/yemeksepeti/YsFooter.tsx", "utf8");
const themeCss = readFileSync("src/styles/yemeksepeti.css", "utf8");

test("favorites banner uses the soft pink campaign surface", () => {
  assert.match(promo, /var\(--pink-pale\)/);
  assert.match(promo, /dark:text-\[var\(--ink-on-light\)\]/);
  assert.doesNotMatch(promo, /bg-gold/);
});

test("testimonials use the soft pink section surface and explicit contrast", () => {
  assert.match(testimonials, /bg-pink-pale/);
  assert.match(testimonials, /text-ink/);
  assert.match(testimonials, /dark:text-\[var\(--ink-on-light\)\]/);
  assert.match(testimonials, /dark:text-\[var\(--ink-mid-on-light\)\]/);
  assert.match(testimonials, /group-hover\/card:text-paper/);
  assert.doesNotMatch(testimonials, /bg-gradient-to-[lr]/);
});

test("footer owns a semantic surface in both themes", () => {
  assert.match(footer, /bg-paper text-ink/);
  assert.match(footer, /border-line/);
});

test("navbar tab underline animates with transform instead of layout width", () => {
  const tabRule = themeCss.match(/\.ys-tab::after\s*\{([\s\S]*?)\}/)?.[1] ?? "";
  assert.match(tabRule, /scaleX\(0\)/);
  assert.match(tabRule, /transition:\s*transform/);
  assert.doesNotMatch(tabRule, new RegExp("transition:[\\s\\S]*" + "wid" + "th"));
});
