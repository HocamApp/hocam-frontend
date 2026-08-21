import assert from "node:assert/strict";
import { describe, it } from "node:test";
// Read the real palette rather than a hand-copied hex table, so a hue added
// later is measured with the same numbers Tailwind will actually emit.
import tailwindColors from "tailwindcss/colors.js";

import type { ScheduleEvent } from "@/types";
import {
  CURATED_SUBJECT_HUES,
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
    assert.deepEqual(FALLBACK_HUE_RING, [
      "blue",
      "violet",
      "teal",
      "rose",
      "orange",
      "cyan",
      "purple",
      "green",
      "fuchsia",
      "amber",
      "sky",
      "pink",
      "lime",
      "stone",
      "emerald",
      "slate",
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

// The product rule, enforced rather than only documented: a booked lesson must
// never be drawable as something the student typed in.
describe("a lesson never looks like a personal block", () => {
  it("draws lessons outlined and tinted, whatever the subject", () => {
    ["Matematik", "Felsefe", "Astronomi", "Tarih-1"].forEach((name) => {
      const tone = toneForEvent(lesson(name));
      assert.match(tone.card, /border-/, `${name} lost its border`);
      assert.match(tone.card, /bg-[a-z]+-50\b/, `${name} is not a -50 tint`);
      assert.doesNotMatch(tone.card, /text-white/, `${name} reads as a solid fill`);
      assert.equal(tone.kindLabel, "Hocam Dersi");
    });
  });

  it("falls back to the brand tint when a lesson has no subject", () => {
    const tone = toneForEvent(lesson(null));
    assert.match(tone.card, /bg-brand-50/);
    assert.equal(tone.kindLabel, "Hocam Dersi");
  });

  it("draws every personal block type as a solid fill", () => {
    Object.entries(STUDY_TONES_FOR_TEST).forEach(([type, tone]) => {
      assert.match(tone.card, /text-white/, `${type} is not filled`);
      assert.match(tone.card, /border-transparent/, `${type} kept a border`);
    });
  });

  it("keeps coaching on indigo", () => {
    const tone = toneForEvent({ ...lesson(null), source: "coaching" });
    assert.match(tone.card, /indigo/);
    assert.equal(tone.kindLabel, "Koçluk Görüşmesi");
  });
});

/**
 * Contrast, measured rather than asserted in a comment.
 *
 * The palette steps are read back out of the class strings and looked up in
 * Tailwind's own colours, so a hue added later without checking its contrast
 * fails here instead of shipping. The dark surface is the -950/50 tint
 * composited over --card (220 37% 14%), which is what the viewer actually sees.
 */
const TAILWIND_COLORS = tailwindColors as unknown as Record<string, Record<number, string>>;

describe("subject hue contrast", () => {
  const CARD_DARK = hslToRgb(220, 37, 14);

  function hslToRgb(h: number, s: number, l: number): number[] {
    const sat = s / 100;
    const light = l / 100;
    const a = sat * Math.min(light, 1 - light);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return light - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1));
    };
    return [f(0), f(8), f(4)];
  }

  function hexToRgb(hex: string): number[] {
    return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  }

  function luminance(rgb: number[]): number {
    const [r, g, b] = rgb.map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(a: number[], b: number[]): number {
    const first = luminance(a);
    const second = luminance(b);
    const [hi, lo] = first > second ? [first, second] : [second, first];
    return (hi + 0.05) / (lo + 0.05);
  }

  function over(foreground: number[], alpha: number, background: number[]): number[] {
    return foreground.map((channel, index) => channel * alpha + background[index] * (1 - alpha));
  }

  function step(hue: string, shade: number): number[] {
    const palette = TAILWIND_COLORS[hue];
    assert.ok(palette?.[shade], `tailwind has no ${hue}-${shade}`);
    return hexToRgb(palette[shade]);
  }

  Object.values(SUBJECT_HUES).forEach((hue) => {
    it(`${hue.id} clears AA in both themes`, () => {
      const tintLight = step(hue.id, 50);
      const tintDark = over(step(hue.id, 950), 0.5, CARD_DARK);

      const lightBody = contrast(step(hue.id, 900), tintLight);
      const lightLabel = contrast(step(hue.id, 800), tintLight);
      const darkBody = contrast(step(hue.id, 100), tintDark);
      const darkLabel = contrast(step(hue.id, 300), tintDark);

      assert.ok(lightBody >= 4.5, `${hue.id} light body ${lightBody.toFixed(2)}`);
      assert.ok(lightLabel >= 4.5, `${hue.id} light label ${lightLabel.toFixed(2)}`);
      assert.ok(darkBody >= 4.5, `${hue.id} dark body ${darkBody.toFixed(2)}`);
      assert.ok(darkLabel >= 4.5, `${hue.id} dark label ${darkLabel.toFixed(2)}`);
    });
  });

  it("uses the -800 label step, which -700 could not clear with headroom", () => {
    Object.values(SUBJECT_HUES).forEach((hue) => {
      assert.match(hue.label, new RegExp(`text-${hue.id}-800\\b`));
    });
  });
});
