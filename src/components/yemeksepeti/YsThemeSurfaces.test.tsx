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

test("testimonials run on themed surfaces with a gold hover", () => {
  // The section is the page's own paper, so both themes are carried by the
  // tokens and no fixed campaign surface has to pin its ink.
  assert.match(testimonials, /bg-paper/);
  assert.doesNotMatch(testimonials, /bg-pink-pale/);
  assert.doesNotMatch(testimonials, /dark:text-\[var\(--ink-(mid-)?on-light\)\]/);

  assert.match(testimonials, /text-ink/);
  assert.match(testimonials, /hover:bg-gold/);
  // DESIGN.md: text on gold is --gold-ink, never white and never gray.
  assert.match(testimonials, /group-hover\/card:text-gold-ink/);
  assert.match(testimonials, /group-hover\/card:text-\[rgb\(74_59_0_\/_78%\)\]/);
  assert.doesNotMatch(testimonials, /group-hover\/card:text-paper/);
  assert.doesNotMatch(testimonials, /bg-gradient-to-[lr]/);
});

test("testimonials keep every voice on a single marquee row", () => {
  const rows = testimonials.match(/<Marquee/g) ?? [];
  assert.equal(rows.length, 1);
  assert.match(testimonials, /TESTIMONIALS\.map/);
  assert.doesNotMatch(testimonials, /SECOND_ROW/);
  // Behaviour is untouched: the row still pauses on hover at the same speed.
  assert.match(testimonials, /pauseOnHover/);
  assert.match(testimonials, /\[--duration:38s\]/);
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
