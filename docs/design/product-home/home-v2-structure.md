# Authenticated Student Home — V2 structure

Supersedes the section layout in `docs/authenticated-home-wireframe-spec.md`.
That document's product/route decisions (§1) still hold; its section-by-section
wireframe does not.

Route, auth and role behavior are unchanged: `/home` stays authenticated,
`RoleAwareHome` still sends tutors to `TutorAuthenticatedHome`, and the navbar
is untouched. The redesign is entirely below the navbar.

## Section order

| # | Section | Component | Data source |
|---|---------|-----------|-------------|
| 1 | Hero carousel | `HomeHeroCarousel` | Mock slides (`HOME_HERO_SLIDES`) |
| 2 | Search band | `HomeSubjectSearch` + quick links | **Real** — subjects API |
| 3 | Kaldığın yerden devam et | inline `ContinueCard` | **Real** — bookings / goals / packages |
| 4 | Sınav hedeflerini keşfet | `HomeExploreCarousel` | Mock cards, real destinations |
| 5 | Öne çıkan hocalar | `HomeTeacherRail` | **Real** tutors, mock top-up |
| 6 | Derse göre hoca seç | `HomeTabbedDiscovery` | **Real** filtered tutors per tab, mock top-up |
| 7 | Hedefine göre ilerle | `HomeGoalCards` | Mock cards, real destinations |
| 8 | Popüler konular | `HomeTopicLinks` | Mock copy/counts, real destinations |
| 9 | Closing promo strip | `HomePromoStrip` | Mock copy, real CTA |

Section 3 renders only when the student actually has an upcoming lesson, an
active goal or a live package, so a new account goes straight from search into
discovery.

## Mock content

All static content lives in `src/components/home/homeShowcaseContent.ts`.
Replace it section by section as real endpoints land — every `href` in it
already points at a route that exists, and `homeShowcaseContent.test.ts`
enforces that.

Placeholder teachers are labelled with an "Örnek içerik" badge and have no
profile link, so mock rows are never mistaken for real tutors.

## Placeholder artwork

`HomeVisual` generates all imagery from gradients plus geometric SVG — no
photographs and no human likenesses. Variants alternate between a brand tint
and a neutral tint; the brand ramp is an identity colour, so it punctuates
rather than covers the page.

## Rails

`HomeRail` is the shared horizontal scroller: CSS scroll-snap plus native
overflow, with chevron buttons above `md`. No carousel dependency was added.
Cards are `~78vw` on mobile so the next card peeks.

Every rail sits inside a `min-w-0` container and the page wrapper keeps
`overflow-hidden`; `scripts/responsive-check.ts` asserts no horizontal overflow
on `/home` at 375/768/1280.

## Review screenshots

`scripts/home-review-shots.ts` logs in through the real login form and captures
`/home` at desktop and mobile for two accounts. It needs
`HOME_REVIEW_CREDENTIALS` pointing at a JSON file of throwaway local accounts —
see the seeding workflow used for the V2 review (local SQLite only).

## Reference rules

Structure and interaction were taken from the Udemy captures under
`references/desktop-source/`; colour, type, imagery and copy were not. See
`references/desktop-source/REFERENCE_RULES.md`. The
`refero-udemy-style-extended.md` token dump in that folder must not be
installed — it would overwrite Hocam's own theme layer.
