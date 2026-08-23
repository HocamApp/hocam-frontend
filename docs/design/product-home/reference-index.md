# Product Home — Reference Index

Inventory of every research file copied into this repository for the
`feature/udemy-inspired-product-home` work.

- **Source (untouched):** `/Users/ardagg/Desktop/udemylike/`
- **Destination:** `docs/design/product-home/references/desktop-source/`
- **Copy method:** `cp -Rn` (non-clobbering recursive copy). No file was renamed,
  moved, or deleted; the Desktop original remains in place.
- **Files copied:** 10 visible files (8 PNG, 2 Markdown) plus one macOS `.DS_Store`
  metadata file that was carried along by the recursive copy.

## Markdown / text references

| Original filename | Repository path | Type | Purpose | Inspected? | Limitations |
| --- | --- | --- | --- | --- | --- |
| `refero-udemy-style-extended.md` | `references/desktop-source/refero-udemy-style-extended.md` | Markdown, 386 lines | Machine-generated (Refero-style) extraction of Udemy's **brand system**: color tokens, type scale, spacing scale, radii, shadows, component recipes, do/don't list, plus ready-to-paste CSS custom properties and a Tailwind v4 `@theme` block. | Yes, in full | This is the single highest-risk file in the folder. It is a **token dump designed to be installed**, and installing it would replace Hocam's design system with Udemy's. Only its *structural* observations (layout rhythm, section order, card anatomy, carousel/pagination behavior) may be used. See `REFERENCE_RULES.md`. |
| `REFERENCE_RULES.md` | `references/desktop-source/REFERENCE_RULES.md` | Markdown, 50 lines | Author-supplied usage rules: what may be borrowed (hierarchy, search placement, section ordering, recommendation patterns, carousels, card hierarchy, category discovery, responsive behavior, loading/empty states, density, personalization logic) and what may not (colors, fonts, logos, imagery, copy, CSS variables, Tailwind tokens, token JSON, pixel-perfect styling, marketing testimonials/footer). | Yes, in full | None. Its content is promoted verbatim-in-spirit into `docs/design/product-home/REFERENCE_RULES.md`, which is the canonical rules file for this project. |

## Screenshots

All eight screenshots are **2880 × 1800 px** (macOS Retina full-window captures,
including browser chrome, tab bar, and URL bar). They are a sequential
top-to-bottom scroll of **one page**: `udemy.com/` in a **logged-out /
anonymous** state, captured 2026-07-23 at ~22:26.

Every image was opened and visually inspected (downscaled to 1400 px wide for
reading). Content descriptions below are from actual inspection, not filename
inference.

| Original filename | Repository path | Dimensions | Observed content | Inspected? |
| --- | --- | --- | --- | --- |
| `Ekran Resmi 2026-07-23 22.25.56.png` | `references/desktop-source/…` | 2880×1800 | **Top of page.** Dismissible promo bar; header = wordmark + 3 nav links + full-width pill search ("Search for anything") + secondary links + cart + `Log in` (outlined) / `Sign up` (filled violet) + locale globe. Below: full-bleed yellow hero carousel with an overlaid white copy card ("Learning that gets you") and left/right circular arrows. Then the start of a category band with 3D-illustration tiles. | Yes |
| `Ekran Resmi 2026-07-23 22.26.09.png` | `references/desktop-source/…` | 2880×1800 | **"Trending Courses" row** — 4-up card grid with a right chevron indicating a horizontal carousel. Card anatomy: 16:9 thumbnail → 2–3 line title → instructor line → badge row (`Bestseller`, `★ 4.7`, `193,437 ratings`) → price. Below it, the start of a dark inverted band ("Reimagine your career for the AI era"). | Yes |
| `Ekran Resmi 2026-07-23 22.26.12.png` | `references/desktop-source/…` | 2880×1800 | **Tabbed discovery module.** Section title + subtitle, then an underlined tab strip (`Artificial Intelligence (AI)`, `Python`, `Microsoft Excel`, …) that swaps a 4-up course-card carousel below it, closed by a `Show all … courses →` text link. | Yes |
| `Ekran Resmi 2026-07-23 22.26.14.png` | `references/desktop-source/…` | 2880×1800 | **Social-proof band** — "trusted by over 17,000 companies" + grayscale company logo row on a tinted surface. Then a 4-up testimonial card grid (quote glyph, quote, avatar + name + role, violet `View … course →` link) and a `View all stories →` link. | Yes |
| `Ekran Resmi 2026-07-23 22.26.17.png` | `references/desktop-source/…` | 2880×1800 | **Dark inverted panel** ("Get certified…") containing 3 nested dark cards (image + provider name + topic) and a text CTA. Below, the start of "Ready to reimagine your career?" with large image-led cards. | Yes |
| `Ekran Resmi 2026-07-23 22.26.21.png` | `references/desktop-source/…` | 2880×1800 | **"Career Accelerators" 3-up card row** — large 16:9 image, title, then a metadata pill row (`★ 4.7`, `332K ratings`, `29 total hours`), plus `All Career Accelerators →`. Then the start of the "Popular Skills" link-column block. | Yes |
| `Ekran Resmi 2026-07-23 22.26.22.png` | `references/desktop-source/…` | 2880×1800 | **"Popular Skills" block** — a 4-column layout of category headings with linked skill names and a "N learners" count under each, plus an outlined `Show all trending skills` button. Then the dark business band and the top of the SEO footer. | Yes |
| `Ekran Resmi 2026-07-23 22.26.24.png` | `references/desktop-source/…` | 2880×1800 | **Footer.** Multi-row, 4-column SEO link farm on the dark panel, then About / Discover / Business / Legal columns, wordmark, copyright, cookie settings, language switcher. | Yes |

## Inventory findings that affect the redesign

1. **There is no Refero screenshot and no Udemy logged-in screenshot.** Despite
   the "Refero" name in the Markdown filename, Refero here is only the *source of
   the style extraction*; every image is Udemy's own anonymous homepage. This is
   the single most consequential gap: Hocam's homepage (`/home`) is an
   **authenticated** page, so roughly half of what the references show
   (acquisition hero, company-logo trust bar, testimonial grid, SEO footer farm)
   has no counterpart in the page being redesigned. Detail in
   `reference-analysis.md`.
2. **The only complete, transferable patterns are structural**: prominent search
   in the header, section = heading + subtitle + card row + "show all" link,
   4-up horizontal carousels with chevron affordance, a tab strip that swaps the
   row beneath it, consistent card anatomy (media → title → secondary line →
   metric pills → price), one dark inverted band used as a rhythm break, and a
   link-column block for long-tail discovery.
3. **The Markdown token dump must not be executed.** It contains literal
   `:root { --color-aubergine: #6d28d2; … }` and a Tailwind `@theme` block. Hocam
   already has its own token layer (`src/app/globals.css` + `tailwind.config.ts`,
   shadcn HSL variables with light/dark themes). Pasting the reference tokens
   would break dark mode and the entire component library at once.

## Limitations of this inventory

- Screenshots include browser chrome; the actual page viewport is ~1400 px CSS
  wide at 2× scale, so measured pixel values in these captures are not directly
  usable as CSS values.
- No mobile or tablet capture of the reference exists. Responsive claims about
  Udemy in `reference-analysis.md` are therefore reasoned from the desktop
  composition and the Markdown's layout notes, and are labelled as such rather
  than presented as observed behavior.
- No capture of a logged-in Udemy state exists, so the reference cannot answer
  "what does this marketplace show a returning, paying user?" — the exact
  question Hocam's `/home` has to answer.
