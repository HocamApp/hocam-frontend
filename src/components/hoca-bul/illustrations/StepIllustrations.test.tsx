import "@/test/setupDom";

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import { answerStateVariants, assemblyVariants } from "../motion";
import { IllustrationFrame } from "./IllustrationFrame";
import { toIllustrationState } from "./illustrationState";
import { PENDING_STEPS, renderIllustration } from "./registry";
import { COMPACT_HIDDEN_LAYERS } from "./illustrationTokens";
import type { HocaBulStepId } from "@/types/hocaBul";

// framer-motion reads matchMedia, which the shared jsdom setup does not provide.
// Reduced motion is exercised through renderIllustration's own flag rather than
// this stub: framer-motion caches its first answer for the module's lifetime, so
// flipping the query between tests would not actually flip the branch.
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

const ALL_STEPS: HocaBulStepId[] = [
  "hedef",
  "asama",
  "yks_alan",
  "dersler",
  "zorluk",
  "hoca_yaklasimi",
  "uygun_zamanlar",
  "butce",
  "kontrol",
];

const ILLUSTRATION_DIR = path.join(
  process.cwd(),
  "src/components/hoca-bul/illustrations"
);

const SOURCES = readdirSync(ILLUSTRATION_DIR)
  .filter((file) => /\.tsx?$/.test(file) && !file.includes(".test."))
  .map((file) => ({
    file,
    text: readFileSync(path.join(ILLUSTRATION_DIR, file), "utf8"),
  }));

function renderFrame(step: HocaBulStepId, compact = false) {
  return render(
    React.createElement(IllustrationFrame, {
      state: toIllustrationState(step, {}, {}),
      compact,
    })
  );
}

afterEach(() => {
  cleanup();
});

describe("registry coverage", () => {
  it("draws something for every step in the flow", () => {
    for (const step of ALL_STEPS) {
      const { container } = renderFrame(step);
      const svg = container.querySelector("svg");
      assert.ok(svg, `no svg for ${step}`);
      assert.equal(svg?.getAttribute("data-step"), step);
      assert.ok(
        svg!.querySelectorAll("[data-layer]").length > 0,
        `no layers for ${step}`
      );
      cleanup();
    }
  });

  it("still draws the neutral scene for the six steps P4B completes", () => {
    assert.equal(PENDING_STEPS.length, 6);
    for (const step of PENDING_STEPS) {
      const { container } = renderFrame(step);
      assert.ok(container.querySelector('[data-layer="primary-object"]'));
      cleanup();
    }
  });
});

describe("decorative semantics", () => {
  it("hides every illustration from assistive technology", () => {
    for (const step of ALL_STEPS) {
      const { container } = renderFrame(step);
      const svg = container.querySelector("svg")!;
      assert.equal(svg.getAttribute("aria-hidden"), "true", step);
      assert.equal(svg.getAttribute("role"), "presentation", step);
      cleanup();
    }
  });

  it("keeps every illustration out of the tab order", () => {
    for (const step of ALL_STEPS) {
      const { container } = renderFrame(step);
      const svg = container.querySelector("svg")!;
      assert.equal(svg.getAttribute("focusable"), "false", step);
      assert.equal(svg.querySelectorAll("[tabindex]").length, 0, step);
      assert.equal(
        svg.querySelectorAll("a, button, input, [role='button']").length,
        0,
        step
      );
      cleanup();
    }
  });

  it("puts no label, title or text of any kind inside the artwork", () => {
    // Anything the student must read belongs in the question, never in an SVG
    // that assistive technology is told to skip.
    for (const step of ALL_STEPS) {
      const { container } = renderFrame(step);
      const svg = container.querySelector("svg")!;
      assert.equal(svg.textContent, "", step);
      assert.equal(svg.querySelectorAll("text, title, desc").length, 0, step);
      cleanup();
    }
  });
});

describe("answer-reactive states", () => {
  it("fills the target differently per goal while the target itself stays put", () => {
    const rings = new Map<string, number>();
    let targetGeometry: string | null = null;

    for (const goal of ["YKS", "DGS", "KPSS", "UNDECIDED"] as const) {
      const { container } = render(
        React.createElement(
          "svg",
          null,
          renderIllustration(toIllustrationState("hedef", { goal }, {}), {
            compact: false,
            reduced: true,
          })
        )
      );
      rings.set(
        goal,
        container.querySelectorAll('[data-layer="answer-state"] circle').length
      );

      // The target is the constant. If it moved between answers the composition
      // would read as breaking rather than as responding.
      const geometry = Array.from(
        container.querySelectorAll('[data-layer="primary-object"] circle')
      )
        .map((c) => `${c.getAttribute("cx")},${c.getAttribute("cy")},${c.getAttribute("r")}`)
        .join("|");
      if (targetGeometry === null) targetGeometry = geometry;
      else assert.equal(geometry, targetGeometry, `target moved for ${goal}`);
      cleanup();
    }

    assert.equal(rings.get("YKS"), 4);
    assert.equal(rings.get("DGS"), 3);
    assert.equal(rings.get("KPSS"), 2);
    // Undecided has not landed, so nothing is filled in.
    assert.equal(rings.get("UNDECIDED"), 0);
  });

  it("shows an arrow for every answered goal, including undecided", () => {
    for (const goal of ["YKS", "DGS", "KPSS", "UNDECIDED"] as const) {
      const { container } = render(
        React.createElement(
          "svg",
          null,
          renderIllustration(toIllustrationState("hedef", { goal }, {}), {
            compact: false,
            reduced: true,
          })
        )
      );
      // One arrowhead only. A filled triangle at the tail as well read as a
      // second head pointing the same way, so the fletching is feather strokes.
      assert.equal(
        container.querySelectorAll('[data-layer="answer-state"] polygon').length,
        1,
        `expected exactly one arrowhead for ${goal}`
      );
      cleanup();
    }
  });

  it("shelves one book per selected subject, and none at zero", () => {
    for (const [count, expected] of [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 3],
    ] as const) {
      const keys = Array.from({ length: count }, (_, i) => `subject-${i}`);
      const { container } = render(
        React.createElement(
          "svg",
          null,
          renderIllustration(
            toIllustrationState("dersler", { subject_keys: keys }, {}),
            { compact: false, reduced: true }
          )
        )
      );
      assert.equal(
        container.querySelectorAll('[data-layer="answer-state"] > g').length,
        expected,
        `count ${count}`
      );
      // The shelf always holds three books; the unchosen ones stay outlines.
      const outlined = container.querySelectorAll(
        '[data-layer="primary-object"] > g'
      ).length;
      assert.equal(outlined + expected, 3, `count ${count} lost a book`);
      cleanup();
    }
  });

  it("lights the cells a window owns, and replaces the grid for flexible", () => {
    const { container } = render(
      React.createElement(
        "svg",
        null,
        renderIllustration(
          toIllustrationState(
            "uygun_zamanlar",
            { availability_windows: ["weekday_day"] },
            {}
          ),
          { compact: false, reduced: true }
        )
      )
    );
    // Five weekday columns in the day row.
    assert.equal(
      container.querySelectorAll('[data-layer="answer-state"] rect').length,
      5
    );
    cleanup();

    const weekend = render(
      React.createElement(
        "svg",
        null,
        renderIllustration(
          toIllustrationState(
            "uygun_zamanlar",
            { availability_windows: ["weekend_evening"] },
            {}
          ),
          { compact: false, reduced: true }
        )
      )
    );
    assert.equal(
      weekend.container.querySelectorAll('[data-layer="answer-state"] rect').length,
      2
    );
    cleanup();

    const flex = render(
      React.createElement(
        "svg",
        null,
        renderIllustration(
          toIllustrationState(
            "uygun_zamanlar",
            { availability_windows: ["flexible"] },
            {}
          ),
          { compact: false, reduced: true }
        )
      )
    );
    // One continuous band, and the empty grid is not drawn underneath it — a
    // translucent panel over the cells let them bleed through as a cross.
    assert.equal(
      flex.container.querySelectorAll('[data-layer="answer-state"] rect').length,
      1
    );
    assert.equal(
      flex.container.querySelectorAll('[data-layer="secondary-object"] rect').length,
      0
    );
  });

  it("shows no answer-state shape before anything is answered", () => {
    for (const step of ["hedef", "dersler", "uygun_zamanlar"] as const) {
      const { container } = render(
        React.createElement(
          "svg",
          null,
          renderIllustration(toIllustrationState(step, {}, {}), {
            compact: false,
            reduced: true,
          })
        )
      );
      const answered = container.querySelectorAll(
        '[data-layer="answer-state"] *'
      ).length;
      assert.equal(answered, 0, `${step} should start unanswered`);
      cleanup();
    }
  });

  it("keeps empty shapes unfilled so they cannot read as chosen in dark mode", () => {
    for (const step of ["dersler", "uygun_zamanlar"] as const) {
      const { container } = render(
        React.createElement(
          "svg",
          null,
          renderIllustration(toIllustrationState(step, {}, {}), {
            compact: false,
            reduced: true,
          })
        )
      );
      const filled = Array.from(container.querySelectorAll("rect")).filter((r) =>
        /fill-(muted|brand|sky)/.test(r.getAttribute("class") ?? "")
      );
      assert.equal(filled.length, 0, `${step} paints an empty shape as filled`);
      cleanup();
    }
  });
});

describe("compact behaviour", () => {
  it("reframes the canvas instead of cropping it", () => {
    const { container } = renderFrame("dersler");
    const svg = container.querySelector("svg")!;
    assert.equal(svg.getAttribute("preserveAspectRatio"), "xMidYMid meet");
    assert.equal(svg.getAttribute("viewBox"), "0 0 320 320");
    cleanup();

    const band = renderFrame("dersler", true);
    const bandSvg = band.container.querySelector("svg")!;
    assert.equal(bandSvg.getAttribute("viewBox"), "16 112 288 96");
    assert.equal(bandSvg.getAttribute("preserveAspectRatio"), "xMidYMid meet");
  });

  it("frames the band close to the shape the band actually is", () => {
    // The mobile band ships at 390x120. A compact viewBox far from that ratio
    // letterboxes the artwork into a small island in the middle of a wide strip.
    const [, , width, height] = "16 112 288 96".split(" ").map(Number);
    const ratio = width / height;
    assert.ok(ratio > 2.6 && ratio < 3.6, `compact ratio ${ratio} is far from the band`);
  });

  it("drops the detail layers in the band but never the subject", () => {
    for (const step of ALL_STEPS) {
      const band = renderFrame(step, true);
      const svg = band.container.querySelector("svg")!;
      for (const layer of COMPACT_HIDDEN_LAYERS) {
        assert.equal(
          svg.querySelectorAll(`[data-layer="${layer}"]`).length,
          0,
          `${step} kept ${layer} in the band`
        );
      }
      assert.ok(
        svg.querySelectorAll('[data-layer="primary-object"], [data-layer="foundation"]')
          .length > 0,
        `${step} lost its subject in the band`
      );
      cleanup();
    }
  });
});

describe("reduced motion", () => {
  it("never translates or scales when the preference is set", () => {
    const variants = answerStateVariants(true);
    assert.deepEqual(variants.initial, { opacity: 0 });
    assert.deepEqual(variants.animate, { opacity: 1 });
    assert.equal(variants.transition.duration, 0.12);
  });

  it("drops the stagger as well as the offset, so no intermediate is shown", () => {
    for (const index of [0, 1, 5, 7]) {
      const variants = assemblyVariants(true, index);
      assert.deepEqual(variants.initial, { opacity: 0 });
      assert.equal(
        (variants.transition as { delay?: number }).delay,
        undefined,
        `index ${index} still staggers`
      );
    }
  });

  it("renders the same final composition as it would with motion", () => {
    const state = toIllustrationState(
      "dersler",
      { subject_keys: ["a", "b", "c"] },
      {}
    );
    const withMotion = render(
      React.createElement(
        "svg",
        null,
        renderIllustration(state, { compact: false, reduced: false })
      )
    );
    const motionShapes = withMotion.container.querySelectorAll(
      '[data-layer="answer-state"] rect'
    ).length;
    cleanup();

    const reduced = render(
      React.createElement(
        "svg",
        null,
        renderIllustration(state, { compact: false, reduced: true })
      )
    );
    assert.equal(
      reduced.container.querySelectorAll('[data-layer="answer-state"] rect')
        .length,
      motionShapes
    );
  });

  it("keeps the assembly inside its 1100ms ceiling", () => {
    for (let index = 0; index < 8; index += 1) {
      const { transition } = assemblyVariants(false, index);
      const total =
        (transition as { delay: number }).delay + transition.duration;
      assert.ok(total <= 1.1, `plate ${index} finishes at ${total}s`);
    }
  });
});

describe("cross-fade safety", () => {
  it("emits no id, so two artworks can be mounted at once", () => {
    // The desktop column keeps the outgoing artwork alive while the next one
    // fades in, which would duplicate any generated id in the document.
    const { container } = render(
      React.createElement(
        "div",
        null,
        React.createElement(IllustrationFrame, {
          state: toIllustrationState("dersler", { subject_keys: ["a"] }, {}),
        }),
        React.createElement(IllustrationFrame, {
          state: toIllustrationState("hedef", { goal: "YKS" }, {}),
        })
      )
    );
    assert.equal(container.querySelectorAll("[id]").length, 0);
    assert.equal(container.querySelectorAll("defs, clipPath, mask").length, 0);
  });
});

describe("asset and paint discipline", () => {
  it("ships no raster, video or embedded document", () => {
    for (const step of ALL_STEPS) {
      const { container } = renderFrame(step);
      assert.equal(
        container.querySelectorAll("image, img, video, foreignObject").length,
        0,
        step
      );
      cleanup();
    }
  });

  it("requests nothing from outside the app", () => {
    for (const { file, text } of SOURCES) {
      assert.equal(/https?:\/\//.test(text), false, `${file} has a URL`);
      assert.equal(/url\(/.test(text), false, `${file} references url()`);
    }
  });

  it("uses tokens rather than hardcoded paint", () => {
    for (const { file, text } of SOURCES) {
      const body = text.replace(/\/\*[\s\S]*?\*\//g, "");
      assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(body), false, `${file} has a hex colour`);
      assert.equal(/\brgba?\(|\bhsla?\(/.test(body), false, `${file} has a literal colour`);
      // --primary is near-black in light and bright blue in dark: it would flip
      // the ink's hue rather than its lightness.
      assert.equal(/text-primary\b/.test(body), false, `${file} paints with --primary`);
    }
  });

  it("gives every palette fill a dark-mode counterpart", () => {
    const tokens = SOURCES.find((s) => s.file === "illustrationTokens.ts")!.text;
    const paletteClasses = tokens.match(/"[^"]*(?:brand-|sky-)[^"]*"/g) ?? [];
    assert.ok(paletteClasses.length > 0, "no palette classes found to check");
    for (const entry of paletteClasses) {
      assert.ok(entry.includes("dark:"), `${entry} has no dark variant`);
    }
  });

  it("uses no filter, blur or gradient", () => {
    for (const { file, text } of SOURCES) {
      assert.equal(/filter=|feGaussianBlur|blur-|Gradient/.test(text), false, file);
    }
  });
});

describe("no idle motion", () => {
  it("starts no timer and declares no looping animation", () => {
    for (const { file, text } of SOURCES) {
      assert.equal(/setInterval|setTimeout|requestAnimationFrame/.test(text), false, file);
      assert.equal(/repeat:\s*Infinity/.test(text), false, file);
      assert.equal(/<animate|animateTransform/.test(text), false, file);
    }
  });

  it("renders no SMIL animation element", () => {
    for (const step of ALL_STEPS) {
      const { container } = renderFrame(step);
      assert.equal(
        container.querySelectorAll("animate, animateTransform, animateMotion").length,
        0,
        step
      );
      cleanup();
    }
  });
});

describe("boundaries", () => {
  it("mentions no reference brand anywhere in the family", () => {
    for (const { file, text } of SOURCES) {
      assert.equal(
        /preply|icons8|croods|dayflow/i.test(text),
        false,
        `${file} names a reference source`
      );
    }
  });

  it("reaches for no wizard state, dispatch, router or storage", () => {
    for (const { file, text } of SOURCES) {
      assert.equal(/useReducer|dispatch\(|useRouter|localStorage/.test(text), false, file);
    }
  });

  it("imports no label or API module into the artwork itself", () => {
    // The adapter is allowed hocaBulFlow and the option ORDER constants; the
    // components are allowed neither, which is what keeps Turkish copy and API
    // rules out of the SVGs.
    const components = SOURCES.filter(
      (s) => s.file.endsWith("Illustration.tsx")
    );
    assert.ok(components.length >= 4);
    for (const { file, text } of components) {
      assert.equal(/hocaBulOptions|matchingApi|hocaBulFlow/.test(text), false, file);
    }
  });
});
