# Decorative scribbles — Figma ↔ code map

Purely ornamental background shapes. They carry no meaning, are `aria-hidden`,
never take pointer or keyboard input, and never affect layout.

**Source of truth:** Figma file `Hocam — Scribble Foundation`
(`TPQNch1F7LH2rWep4N3g9u`), page **05 — Editable Website Capture**.

## Approved frames

| Route | Figma frame | Node | Shapes |
|---|---|---|---|
| `/home` | `Homepage — Lite Scribble V2 · Reference Matched` | `139:2` | 16 (+1 clip helper) |
| `/tutors` | `Hocalar — Lite Scribble` | `110:2` | 5 |
| `/dashboard/student` | `Öğrenci Paneli — Lite Scribble` | `110:764` | 3 |
| `/cikmis-sorular` | `Çıkmış Sorular — Lite Scribble` | `110:1130` | 4 |

`Favori Hocalarım` (`/tutors?favorites=1`) has **no approved design** and is
deliberately left undecorated — see the `showFavorites` guard in
`src/components/tutors/TutorsPageClient.tsx`.

Earlier exploration frames (`Exploration 01/A/B/C/C2`, the abandoned
`Homepage — Lite Scribble`, the PNG playground) are **not** references.

## Assets

Exported from the library originals on page `03 — Scribble Assets` via the
Figma plugin API (`node.exportAsync({ format: "SVG_STRING" })`), then optimised
with `npx svgo@3 --multipass`. Opacity and rotation are **not** baked into the
files — they are applied in CSS so one file serves every variant.

| File | Figma node | Intrinsic |
|---|---|---|
| `blob-pink-dotted.svg` | `8:4` background-shape-05-source-3 | 283×300 |
| `blob-yellow.svg` | `7:520` background-shape-07-source-18 | 200×198 |
| `blob-blue.svg` | `22:8` background-shape-10-source-65 | 156×136 |
| `blob-pink-flame.svg` | `22:4` background-shape-09-source-64 | 123×138 |
| `accent-curl.svg` | `8:113` accent-lines-06-source-89 | 34×51 |
| `accent-target-ring.svg` | `7:539` loop-05-source-37 | 87×89 |
| `accent-diamond.svg` | `8:39` spark-07-source-47 | 28×36 |
| `accent-vertical-curl.svg` | `8:93` accent-lines-01-source-81 | 42×97 |
| `accent-spark.svg` | `8:31` spark-06-source-44 | 40×54 |

Total ≈ 17 KB for all nine; a page requests four to six of them.

## Code

- `src/lib/scribbles.ts` — asset registry, placement types, fluid-size helpers.
- `src/lib/scribblePlacements.ts` — the placement data per route/section.
- `src/components/decor/ScribbleLayer.tsx` — clip box, one per section.
- `src/components/decor/Scribble.tsx` — a single shape.

### Positioning model

Figma's absolute page coordinates are **not** copied into code. Instead:

- `top` is a percentage of the **host section's** height, so the layout survives
  copy changes and content of a different height.
- Horizontal position is measured from a **page edge**: `reveal` px of a
  bleeding shape stay inside the viewport, the rest is clipped away.
- Sizes come from the 1440px-wide Figma frame and scale down proportionally
  below that (`fluidPx`), so a decoration keeps its share of the page.

The layer always clips horizontally, so a decoration can never widen the
document. Note that `globals.css` hides scrollbars globally — horizontal
overflow would be invisible to the eye, so check it with
`document.documentElement.scrollWidth`, not by looking.

### The two-tone seam

Between "Sınav hedeflerini keşfet" and "Öne çıkan hocalar" the same pink shape
is drawn twice: once in the upper band at `opacity 0.34`, once in the lower band
at `0.30`, both clipped exactly on the shared edge (`bleedTop`/`bleedBottom` of
0). The overlap makes the lower half read darker, which is the tone step in the
Figma design.

### Responsive

Visibility is a CSS decision (`always` / `narrow-up` / `md-up` / `lg-up`) so no
viewport is measured in JS and there is no hydration mismatch. Roughly: the full
set at `lg`, at most three at `md`, one or two on phones, and nothing below
390px, where readability and touch targets win.

## Adding or moving a decoration

1. Change it in the Figma frame first — that file stays the source of truth.
2. Read the new values from Figma: which section hosts it, its offset inside
   that section, the visible width, opacity and rotation.
3. Convert: `top` = offset ÷ section height, horizontal = distance from the
   page edge.
4. Update `scribblePlacements.ts`. Do not add positioning to page components.
5. Re-check horizontal overflow at 1440 / 1024 / 768 / 390 / 360.
