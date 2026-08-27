import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
// Read the real palette rather than a hand-copied hex table, so a hue added
// later is measured with the same numbers Tailwind will actually emit.
import tailwindColors from "tailwindcss/colors.js";

import type { ScheduleEvent } from "@/types";
import {
  CURATED_SUBJECT_HUES,
  dayHueForEvent,
  FALLBACK_HUE_RING,
  SUBJECT_HUES,
  STUDY_TONES_FOR_TEST,
  subjectColorKey,
  subjectHue,
  toneForEvent,
} from "./scheduleTheme";

function lesson(subjectName: string | null): ScheduleEvent {
  return {
    source: "booking",
    id: "booking-1",
    local_date: "2026-08-21",
    local_time: "18:00",
    duration_minutes: 40,
    status: "confirmed",
    subject: subjectName ? { id: "s1", name: subjectName, exam_type: "TYT" } : null,
    title: subjectName ? `${subjectName} · Memin Sönmez` : "Ders",
    block_type: null,
    completed: null,
    editable: false,
    room_url: "https://8x8.vc/room",
    occurrence_date: null,
    recurrence: null,
    block_title: null,
  };
}

describe("subject colour keys", () => {
  it("folds Turkish casing instead of trusting toLowerCase", () => {
    // "İNGİLİZCE".toLowerCase() is "i" + U+0307, which never equals "ingilizce".
    assert.notEqual("İNGİLİZCE".toLowerCase(), "ingilizce");
    assert.equal(subjectColorKey("İNGİLİZCE"), subjectColorKey("İngilizce"));
    assert.equal(subjectColorKey("İngilizce"), "ingilizce");
  });

  it("ignores surrounding space and inner run-on spacing", () => {
    assert.equal(subjectColorKey("  Genel   Yetenek "), subjectColorKey("Genel Yetenek"));
  });

  it("collapses exam prefixes and ordinal suffixes onto the base subject", () => {
    assert.equal(subjectColorKey("TYT Matematik"), "matematik");
    assert.equal(subjectColorKey("AYT Matematik"), "matematik");
    assert.equal(subjectColorKey("Tarih-1"), "tarih");
    assert.equal(subjectColorKey("Tarih 2"), "tarih");
  });
});

describe("subject hues", () => {
  it("gives two different subjects two different surfaces", () => {
    const maths = subjectHue("Matematik");
    const philosophy = subjectHue("Felsefe");

    assert.ok(maths && philosophy);
    assert.notEqual(maths.card, philosophy.card);
  });

  it("keeps a curated subject on its curated hue", () => {
    assert.equal(subjectHue("Matematik")?.id, CURATED_SUBJECT_HUES.matematik);
  });

  // "Matematik" is curated, so it is answered by a lookup and never reaches the
  // hash. Without an uncurated case here, a refactor that hashed the raw name
  // instead of the folded key would still pass every test above while
  // scattering every uncurated subject across the ring.
  it("normalises on the hash path too, not only for curated subjects", () => {
    const spaced = subjectHue(" İLERİ MATEMATİK ");
    const plain = subjectHue("ileri matematik");

    assert.ok(spaced && plain);
    assert.equal(CURATED_SUBJECT_HUES["ileri matematik"], undefined);
    assert.equal(spaced.id, plain.id);
  });

  it("is stable across calls for an uncurated subject", () => {
    const first = subjectHue("Astronomi");
    const second = subjectHue("Astronomi");

    assert.ok(first);
    assert.equal(first.id, second?.id);
    assert.ok(FALLBACK_HUE_RING.includes(first.id));
  });

  it("has no hue for a missing or blank subject", () => {
    assert.equal(subjectHue(null), null);
    assert.equal(subjectHue("   "), null);
  });

  // Re-colours every uncurated subject on every student's calendar if changed.
  it("pins the fallback ring order", () => {
    // Order is the hash's output, so changing it re-colours every uncurated
    // subject a student already recognises.
    assert.deepEqual(FALLBACK_HUE_RING, [
      "mavi",
      "lacivert",
      "erguvan",
      "zeytin",
      "turkuaz",
      "grafit",
    ]);
  });

  it("every ring entry resolves to a defined hue", () => {
    FALLBACK_HUE_RING.forEach((id) => assert.ok(SUBJECT_HUES[id], `${id} missing`));
  });

  it("every curated subject points at a real hue", () => {
    Object.entries(CURATED_SUBJECT_HUES).forEach(([key, id]) =>
      assert.ok(SUBJECT_HUES[id], `${key} -> ${id} missing`)
    );
  });
});

// The day view trades the filled body for the plain surface plus a fixed 4px
// edge, so a two-hour block does not carry three times the ink of a 40-minute
// one. What it must not trade away is the edge that identifies it.
describe("day-view surfaces stay plain whatever the duration", () => {
  const cases: [string, ScheduleEvent][] = [
    ["lesson", lesson("Matematik")],
    ["subject-less lesson", lesson(null)],
    ["coaching", { ...lesson(null), source: "coaching" }],
    ["study block", { ...lesson(null), source: "study_block", block_type: "deneme" }],
  ];

  cases.forEach(([name, event]) => {
    it(`${name} gets a plain body and a coloured edge`, () => {
      const hue = dayHueForEvent(event);

      // The day view stopped tinting the body at all. A two-hour block used to
      // carry three times the ink of a forty-minute one purely because it was
      // bigger; the colour lives in a fixed 4px edge now, so duration changes
      // the height and nothing else.
      assert.doesNotMatch(hue.dayCard, /text-white/, `${name} is still a solid fill`);
      assert.match(hue.dayCard, /bg-surface/, `${name} is not on the plain surface`);
      assert.match(hue.dayCard, /border-l-4/, `${name} has no edge`);
      assert.match(hue.dot, /bg-\[var\(--subject-\d\)\]|bg-pink/, `${name} has no bar colour`);
    });
  });

  it("gives each study block type its own bar colour", () => {
    const types = ["konu_anlatim", "soru_cozumu", "deneme", "custom"] as const;
    const bars = types.map(
      (block_type) => dayHueForEvent({ ...lesson(null), source: "study_block", block_type }).dot
    );

    assert.equal(new Set(bars).size, types.length, "two block types share a bar colour");
  });
});

// The product rule, enforced rather than only documented: a booked lesson must
// never be drawable as something the student typed in.
describe("a lesson never looks like a personal block", () => {
  // The distinction moved from tint-depth to fill-versus-outline, which is the
  // part that has to keep working: a solid block is the student's own, a
  // surface with a coloured edge is something scheduled for them.
  it("draws every lesson as a surface with a coloured edge", () => {
    ["Matematik", "Felsefe", "Astronomi", "Tarih-1"].forEach((name) => {
      const tone = toneForEvent(lesson(name));
      assert.match(tone.card, /bg-surface/, `${name} lost its surface`);
      assert.match(tone.card, /border-l-4/, `${name} lost its edge`);
      assert.doesNotMatch(tone.card, /text-white/, `${name} reads as a solid fill`);
      assert.equal(tone.kindLabel, "Hocam Dersi");
    });
  });

  it("falls back to the brand edge when a lesson has no subject", () => {
    const tone = toneForEvent(lesson(null));
    assert.match(tone.card, /border-pink/);
    assert.match(tone.card, /bg-surface/);
    assert.equal(tone.kindLabel, "Hocam Dersi");
  });

  it("draws every personal block type as a solid fill", () => {
    Object.entries(STUDY_TONES_FOR_TEST).forEach(([type, tone]) => {
      assert.match(tone.card, /text-white/, `${type} is not filled`);
      assert.match(tone.card, /border-transparent/, `${type} kept a border`);
      assert.match(tone.card, /--subject-\d/, `${type} is off-palette`);
    });
  });

  it("keeps coaching on its own colour, outlined like a lesson", () => {
    const tone = toneForEvent({ ...lesson(null), source: "coaching" });
    assert.match(tone.card, /--subject-2/);
    assert.match(tone.card, /bg-surface/);
    assert.equal(tone.kindLabel, "Koçluk Görüşmesi");
  });
});

/**
 * Contrast, measured rather than asserted in a comment.
 *
 * The palette is six literal hex values in globals.css, so this reads them out
 * of the stylesheet rather than trusting a copy kept here. A colour edited
 * there without checking fails here instead of shipping.
 *
 * Three things are checked, and they are the three that make a categorical
 * palette work: every fill is legible under white text, no two are close
 * enough to be confused, and none of them sits near a brand colour where it
 * could be mistaken for a CTA, a rank badge or an error.
 */
const CSS = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

function token(name: string): string {
  const match = CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `${name} not found in globals.css`);
  return match[1];
}

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function relLum(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function lab(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const deltaE = (a: string, b: string) =>
  Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

const SUBJECT_IDS = [1, 2, 3, 4, 5, 6] as const;

describe("subject palette", () => {
  it("is legible under white text", () => {
    for (const n of SUBJECT_IDS) {
      const value = token(`subject-${n}`);
      assert.ok(
        contrast(value, "#ffffff") >= 4.5,
        `--subject-${n} (${value}) is ${contrast(value, "#ffffff").toFixed(2)}:1 on white`,
      );
    }
  });

  it("keeps every pair far enough apart to tell them apart", () => {
    // 25 is the working floor for "two fills a student can distinguish at chip
    // size". The closest pair as written is about 35.
    for (const a of SUBJECT_IDS) {
      for (const b of SUBJECT_IDS) {
        if (a >= b) continue;
        const d = deltaE(token(`subject-${a}`), token(`subject-${b}`));
        assert.ok(d >= 25, `subject-${a} and subject-${b} are only ${d.toFixed(1)} apart`);
      }
    }
  });

  it("never strays close to a brand colour", () => {
    // A subject block that reads as the pink CTA or the gold rank badge is
    // worse than one that is hard to tell from another subject.
    const brand = ["pink", "gold", "success", "error"] as const;
    for (const n of SUBJECT_IDS) {
      for (const name of brand) {
        const d = deltaE(token(`subject-${n}`), token(name));
        assert.ok(d >= 25, `subject-${n} is only ${d.toFixed(1)} from --${name}`);
      }
    }
  });
});
