# Hocam Product Home — Reference Usage Rules

Files under `docs/design/product-home/references/` are research materials.
They are **not** a design system to install.

This file is binding for all work on `feature/udemy-inspired-product-home`.
If it conflicts with a suggestion inside a reference file, this file wins.

## Patterns that may be adapted

- product-home information hierarchy
- homepage composition
- section relationships
- search placement
- content discovery
- recommendation rows
- horizontal carousels
- card information hierarchy
- personalized modules
- responsive card behavior
- loading patterns
- empty-state patterns
- content density
- vertical rhythm
- interaction hierarchy

## Elements that must not be copied

- Udemy logos
- Udemy fonts
- Udemy brand colors
- Udemy text
- Udemy illustrations
- Udemy photographs
- Udemy icons
- Udemy CSS variables
- Udemy Tailwind tokens
- Udemy design-token JSON
- proprietary source code
- pixel-perfect branded styling

## Final design requirement

The implementation must use Hocam's actual existing:

- typography
- colors
- CSS variables
- design tokens
- buttons
- cards
- icons
- border radii
- shadows
- navigation
- container system
- responsive conventions
- Turkish product terminology

References may influence structure, product logic and interaction only.

## Operational notes for this repository

These are the concrete places where the rule above is easy to break by accident:

1. **`references/desktop-source/refero-udemy-style-extended.md` ends with a
   paste-ready `:root { … }` block and a Tailwind v4 `@theme` block.** Do not
   copy either into `src/app/globals.css` or `tailwind.config.ts`. Hocam's tokens
   are shadcn-style HSL triples with a `.dark` override; the reference tokens are
   flat hex with no dark theme, so pasting them silently breaks dark mode
   everywhere, not just on the homepage.
2. **Do not add a new font.** Hocam loads `Inter` via `next/font/google` in
   `src/app/layout.tsx`. The reference's "Udemy Sans" and its substitute list are
   out of scope.
3. **Do not introduce a chromatic accent.** Hocam's `--primary` is a near-black
   navy in light mode and blue in dark mode. The reference's violet/ember accent
   pair must not appear.
4. **Do not copy fabricated social proof.** The reference leans on `Bestseller`
   badges, "N learners" counters, testimonial quotes, and a company-logo trust
   bar. Hocam may only display metrics it actually receives from its own API
   (rating, review count, completed lesson count, verified status). Inventing a
   badge with no backing field is both a product lie and a copy of Udemy's
   commercial language.
5. **Do not copy marketing sections into an authenticated page.** The references
   are an anonymous acquisition homepage. `/home` is behind `RouteGuard
   requireAuth`. Testimonial grids, logo bars, and SEO footer link farms do not
   belong there.
6. **Turkish only.** All user-facing strings on the homepage are Turkish, per
   `CLAUDE.md`. No reference copy is translated verbatim.
