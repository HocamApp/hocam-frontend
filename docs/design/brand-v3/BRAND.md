# Hocam brand v3: color system

**Status:** approved direction (14 October 2026). This file is the source of truth for color on the site. Where it disagrees with the color section of DESIGN.md, this file wins. Everything else in DESIGN.md (type, radius, elevation, icons, copy rules) still applies.

**Visual reference:** `mockup/home.html` (homepage) and `mockup/components.html` (small parts). Open them in a browser. They are static, light theme only, and use demo data: tutor names, prices and package numbers in the mockup are not facts. Copy and numbers on the real site keep coming from `ysHomeCopy.ts`, `ysHomeFacts.ts` and `lib/lessonPricing.ts`.

## 1. The idea in one line

Three strong colors (black, pink, yellow) and two soft ones (pale pink, pale yellow). **Each section gets one strong moment. Everything that supports it uses the soft tints or neutrals.**

The previous round (option E) used the same three colors and was rejected for one reason: pink, yellow and black appeared together over and over (three icon tiles in three colors, a yellow tag in every card, a pink pill in every heading). The colors were fine; the repetition was tiring. v3 fixes that with composition rules, not new colors.

## 2. Palette

Tokens are CSS custom properties with raw hex values, same convention as today's `globals.css`. Do not add a Tailwind color named `black`: it would override Tailwind's own `black`, which the site already uses with opacity modifiers.

| Token | Light | Role |
|---|---|---|
| `--on-accent` | `#0C0E09` | Text on `--yellow` and on the pink band. Stays black in dark mode |
| `--pink` | `#FA0050` | Action: primary buttons, unread counts, selected day, the pink band, one heading highlight |
| `--pink-deep` | `#D70F64` | Hover/pressed for pink. Also the fill for small pink buttons with white text (see decision D1 in PLAN.md) |
| `--yellow` | `#FCFF1A` | Highlight: hero word, free-trial tag, accent on dark bands. Surface only, never text |
| `--pink-soft` | `#FFE3EE` | Soft surface: TYT, pricing icon tiles, parents banner, a testimonial card |
| `--yellow-soft` | `#FDFFC7` | Soft surface: AYT, guarantee icon tiles, free-trial banner, discount tags |
| `--paper` | `#FBF6F6` | Page canvas (unchanged) |
| `--surface` | `#FFFFFF` | Cards (unchanged) |
| `--line` | `#E6DDDD` | Borders, dividers (unchanged) |
| `--ink` | `#0C0E09` | Body text, rank pills and selected tabs (`bg-ink text-paper`, which flips correctly in dark mode). Same value as `--on-accent` in light |
| `--ink-mid` | `#5C6B6D` | Secondary text (unchanged) |
| `--success` | `#1C7A55` | Form success, the "online" dot (unchanged) |
| `--error` | `#B33A24` | Errors (unchanged) |
| `--band` | `#0C0E09` | Background of dark sections (search bar, pricing box, tutor band, footer) |
| `--on-band` | `#FBF6F6` | Text on `--band` |
| `--on-band-mid` | `rgb(251 246 246 / 70%)` | Secondary text on `--band` |
| `--on-band-quiet` | `rgb(251 246 246 / 14%)` | Quiet fills on `--band`: check circles, step cards |

### What changes from today's tokens

| Today | v3 | Note |
|---|---|---|
| `--pink #FA0050` | `#FA0050` | Unchanged. v3 shipped with `#FF2070`; reverted on 19 Oct 2026 because the owners prefer the brighter pink |
| `--pink-deep #D70F64` | `#D70F64` | Unchanged, reverted with `--pink` |
| `--pink-pale #FCE5F1` | `--pink-soft #FFE3EE` | Keep `--pink-pale` as an alias until Phase 3 |
| `--gold #FFD100` | `--yellow #FCFF1A` | Keep `--gold` as an alias until Phase 3 |
| `--gold-ink #4A3B00` | `--on-accent` | Text on yellow is black |
| `--ink #02171A` | `#0C0E09` | Teal-black becomes neutral black |
| (none) | `--yellow-soft`, `--band`, `--on-band*`, `--on-accent` | New |

The `--brand-50..900` ramp and the shadcn HSL tokens (`--primary` etc.) are legacy. Point `--primary` at the new pink in Phase 2; remove the ramp in Phase 3.

### Dark theme (starting values, verify with screenshots)

The mockup is light only. Dark values follow the existing rule in `globals.css`: a dark canvas, a card one step lighter, soft tints as the strong color at about 15% over `--surface`.

| Token | Dark |
|---|---|
| `--pink-soft` | `#3D2231` |
| `--yellow-soft` | `#384123` |
| `--band` | `#1D282B` (one step above `--surface #182225`, so a band still reads as a band) |
| `--on-band` | `#ECE6E6` |
| `--on-accent` | `#0C0E09` (unchanged: text on yellow and pink stays black) |

`--pink`, `--pink-deep` and `--yellow` do not change in dark. Text on a soft tint uses `--ink`, which is already light in dark mode.

## 3. Composition rules

These are what make v3 work. Check every section against them.

1. **One strong moment per section.** A strong moment is a full-strength pink, yellow or black surface (a band, a banner, a sticker, a filled highlight). A section may have one. Supporting elements use soft tints or neutrals.
2. **The hero is the exception.** It may use black, pink and yellow once each (headline, pink button, yellow highlight, yellow sticker, yellow offset block behind the photo).
3. **Repeated items share one treatment.** A row of icon tiles, chips or steps never cycles through pink, yellow and black. Pick one soft tint for the whole row: pricing tiles are all pale pink, guarantee tiles are all pale yellow. The one allowed cycle is content cards with real content (testimonials), and only through soft tints and white, never strong colors.
4. **Pink is action.** On light backgrounds the primary button is always pink. Other filled controls (selected tab, selected filter) are `bg-ink text-paper`, not pink.
5. **Yellow is a surface, never text.** Yellow buttons only sit on `--band`. On light backgrounds yellow is a highlight or a tag, with black text.
6. **Soft tints carry black text only.** Never pink text on pale pink or similar same-hue pairs (this matches the DESIGN.md tint rule).
7. **Dark bands stay quiet inside.** On `--band`, yellow is used for at most the highlight and the main button. Check circles, step numbers and secondary cards use `--on-band-quiet` and `--on-band-mid`.
8. **Heading highlights.** At most one full pink heading pill per page below the hero ("seç" on the homepage). Other heading pills are `--pink-soft` with black text.
9. **Stickers.** Rotated circle stickers, at most two per page (the hero "İlk 15.000" and one more).
10. **Photos bring color.** Use real photos (campus, tutors) without tints or color overlays. Avatars get no colored rings; status is a small dot.

## 4. Meaning of colors (keep consistent everywhere)

| Thing | Treatment |
|---|---|
| TYT | `--pink-soft` chip or tile, black text |
| AYT | `--yellow-soft` chip or tile, black text |
| YKS rank on a tutor card | `bg-ink text-paper` pill |
| Rank tiers | Top 1.000: ink pill with a yellow star icon. Top 5.000: ink pill. Top 15.000: ink outline pill |
| Free trial available | `--yellow` tag, `--on-accent` text (the only yellow on a tutor card) |
| Discount ("%16 fiyat avantajı") | `--yellow-soft` tag |
| "En popüler" | `--pink` tag, white text, plus a pink border on the selected plan |
| Unread count, notification badge | `--pink` |
| Online | `--success` dot |
| Lesson day in a calendar | `--yellow-soft`; selected day `--pink` |
| Lesson status | Confirmed `--yellow-soft`; waiting: dashed ink outline; done: `bg-ink text-paper`; today: `--pink`; cancelled: `--error` outline |

## 5. Component recipes

All sizes match the mockup. Radius tokens are the existing ones (`--radius-input`, `--radius-card`, `--radius-pill`).

| Component | Recipe |
|---|---|
| Primary button | `--pink` fill (or `--pink-deep`, per D1), white text, 600, pill, height 48 to 52 |
| Secondary button | 2px `--ink` outline, ink text, pill; hover fills ink |
| Button on band | `--yellow` fill, `--on-accent` text, 700; secondary is a 2px `--on-band-mid` outline |
| Icon tile | 48px, radius 14, one soft tint for the whole row, black stroke icon |
| Promo banner | Radius 24, padding 28. In a row of three: one strong (`--band`), two soft (`--yellow-soft`, `--pink-soft`) |
| Testimonial cards | `--yellow-soft`, `--surface` with a line, `--pink-soft`. Quote mark black, or pink on the white card |
| Notification / toast | `--surface`, `--shadow-float`, radius 18. Leading avatar or a 36px soft-tint circle with a black icon. Unread count `--pink` |
| Reminder (urgent) | `--band` card with one `--yellow` action button |
| Status chip | See section 4 |
| Progress bar | `--band` card, track `--on-band-quiet`, fill `--yellow` |
| Tabs and filters | Selected: `bg-ink text-paper`. Unselected: `--surface` with a `--line` border |
| FAQ tabs | Same as tabs (selected is black, not pink) |
| Footer | `--band`. "Mobil uygulama yakında" is an outline pill, not yellow |

## 6. Contrast (measured)

| Pair | Ratio | Use |
|---|---|---|
| `--on-accent` on `--yellow` | 18.0:1 | OK everywhere |
| `--ink` on `--pink-soft` | 16.1:1 | OK |
| `--ink` on `--yellow-soft` | 18.8:1 | OK |
| `--on-accent` on `--pink` | 5.3:1 | OK: text on the pink band is black |
| White on `--pink` | 3.7:1 | Only text 24px+ or 19px+ bold (heading pills). Fails for 15 to 16px button text |
| White on `--pink-deep` | 4.8:1 | OK for button text |
| `--ink-mid` on `--paper` | 5.2:1 | OK |
| `--pink` on `--paper` (as text) | 3.5:1 | Do not use pink as body text |

## 7. Do and don't

| Do | Don't |
|---|---|
| One strong block per section, the rest soft | Three tiles in pink, yellow and black next to each other |
| Same soft tint across a repeated row | A yellow tag on every card in a row |
| Ink for selected tabs and filters | Pink for every selected state |
| Yellow buttons on dark bands only | Yellow text, or yellow buttons on paper |
| Real photos, untinted | Color overlays, gradients, colored avatar rings |
| Black text on the pink band | White body text on pink |
