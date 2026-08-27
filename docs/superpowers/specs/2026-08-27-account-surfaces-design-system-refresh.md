# Account Surfaces Design System Refresh

**Date:** 2026-08-27  
**Status:** Approved for implementation  
**Design authority:** `/Users/ardagg/Desktop/DESIGN.md`

## Objective

Bring the student-facing account and support surfaces into one coherent Hocam visual system without changing routes, data contracts, business rules, or existing functional animations. The work covers the payments, profile, security, lessons, support, homepage dark-mode defects, and shared navigation/footer theme behavior shown in the supplied screenshots.

The result must feel like one product in both themes. The current mix of legacy shadcn HSL tokens and the newer DESIGN.md hex tokens is the primary systemic defect: it produces navy canvases, brown search fields, cool blue states, and white footer discontinuities in dark mode.

## Design decisions

### 1. Theme foundation

- Keep DESIGN.md tokens as the source of truth: `paper`, `surface`, `line`, `ink`, `ink-mid`, `pink`, `pink-deep`, `pink-pale`, `gold`, `gold-ink`, `success`, and `error`.
- Bridge legacy shadcn semantic tokens to the same warm neutral system in both themes instead of allowing a second navy/blue palette.
- Dark mode uses derived dark neutrals: a dark paper canvas, a single lighter surface step, and a hairline one step above the surface.
- Primary actions remain pink with white text. Secondary actions remain transparent with an ink border. Disabled actions use a neutral fill and readable secondary text.
- Gold remains a surface, never text. Text on gold always uses `gold-ink`.
- Remove hard-coded blue, navy, amber, and same-hue tint badge constructions from the touched surfaces when DESIGN.md already provides the correct semantic treatment.
- Preserve the study-calendar subject palette exception already documented in `globals.css`.

### 2. Shared interaction language

- In-flow panels use `surface` plus a `line` hairline and no shadow.
- Dialogs and popovers use the floating shadow and modal radius.
- Buttons use pill radius; fields use input radius; cards use card radius; dialogs use modal radius.
- Hover changes color or border only for 120 ms. No lift, scale, translation, or decorative motion is added.
- Existing functional animation in the payment-method selector is preserved.
- All touched controls receive readable default, hover, focus, active, disabled, loading, and error states.
- Phosphor regular icons are preferred on newly touched UI. This work does not require an unrelated repository-wide icon migration.

## Surface designs

### Payments: `/profile/payments`

- Keep the route and package/payment APIs unchanged.
- Simplify the header description to focus on packages and payment history; remove referral language.
- Rebuild package summaries as clear list surfaces with this hierarchy:
  1. tutor and plan,
  2. status,
  3. lesson credit, amount, request date, and approval/expiry data,
  4. expanded operational detail.
- Use tabular figures for credits, prices, and dates.
- Replace generic tinted status treatments with the approved solid, outline, or plain-text constructions.
- Keep package expansion behavior and request/cancellation actions intact.
- Payment history uses readable rows on `surface`; the empty state keeps its meaning and receives a clear next action where one is available.
- Remove the referral section from this page completely.

### Referral placement: `/profile`

- Place a new “Arkadaşını davet et” utility surface immediately below the identity card.
- Use a gold surface with `gold-ink`, because this is an offer/reward context explicitly assigned to gold in DESIGN.md.
- Show the referral code, invitation explanation, and copy-link action without exposing an oversized read-only URL by default.
- Preserve the existing referral API and clipboard fallback behavior.
- The referral card must remain useful before rewards activate; copy explains that rewards will become active later without promising a date.

### Profile overview: `/profile`

- Preserve profile editing, avatar, notification, tutor/student branching, and learning data behavior.
- Reduce nested-card density and use clearer section hierarchy.
- Keep the identity block as the first surface, followed by the referral surface for students, notifications, and the learning/account overview.
- Replace equal-card/bento-like arrangements with one-up or asymmetric two-column layouts.
- Use gold only for earned or offer-related surfaces, not decorative text.

### Security: `/profile/security`

- Preserve verification, password, session, and account-deletion mechanics.
- Present verification, password/sessions, and dangerous actions as distinct sections with consistent card anatomy.
- Use an outline or solid semantic state rather than pale tint badges.
- Use gold with `gold-ink` for the unverified action surface where it communicates a pending achievement; verified state uses success semantics.
- Account deletion remains deliberately serious but not visually oversized.
- The final “Hesabı kalıcı olarak sil” action uses the DESIGN.md error color with white text, a balanced default button size, and a visible focus state.
- Error cannot be confused with brand pink.

### Payment methods dialog

- Preserve open/close and selection animations.
- Apply modal radius and floating elevation to the dialog only.
- Method rows use input/card radii, hairline borders, and an ink selected state.
- “Kart ekle” remains present with its current non-production behavior.
- No real payment collection or API behavior is added.

### Lessons: `/profile/lessons`

- Preserve tabs, filters, list/calendar switching, booking actions, disputes, reviews, materials, and room join timing.
- Remove the three equal summary cards. Replace them with a compact asymmetric summary region that gives the upcoming count priority and keeps secondary counts inline.
- Make the next lesson the primary in-flow surface rather than a navy promotional panel.
- Use a gold date/time lockup with `gold-ink` as the main meaningful gold application on this page.
- Active “Derse katıl” is pink with white text. Disabled or not-yet-open join controls use a neutral fill and readable `ink-mid`, including hover behavior that cannot erase the label.
- Booking rows keep operational density but follow the shared surface, border, typography, and status vocabulary.
- Empty, loading, issue, and historical states remain functional and receive consistent visual treatment.

### Support: `/support`

- Preserve ticket submission, ticket list, deep links, FAQ behavior, and the existing assistant widget.
- Shorten the introductory copy and use direct `sen` language.
- Use an asymmetric 7/5 desktop layout for request creation and help/rules; stack on mobile.
- Normalize select, input, textarea, button, accordion, loading, empty, success, and error states.
- Replace decorative/tinted header icon treatment with the standard icon and surface vocabulary.
- Do not add new support mechanics.

### Homepage dark mode

- Keep the favorites demonstration and testimonial marquee behavior.
- Make “Favori hocalarının listesini oluştur” readable in both themes.
- Make “Hocalar ve Öğrencilerden” and its supporting copy readable in both themes.
- Testimonial hover uses a valid inverse pair in both themes and never produces light-on-light text.
- Edge fades must match the active section surface. Existing gradients that only simulate the fade should be replaced with a non-gradient mask or a flat edge treatment because DESIGN.md bans gradients.

### Navbar, search, dashboard, coaching, and footer dark mode

- Navbar rows, active navigation, search, page canvas, and footer use one derived dark neutral family.
- The “Hoca ara” control must not inherit the warm brown legacy `muted` fill.
- Remove blue active accents and navy page regions from touched authenticated surfaces.
- Footer must not switch to a light surface while the page is in dark mode.
- Preserve the single-navbar architecture and the existing header-height contract.
- Preserve the prior coaching redesign work already present in the working tree; only shared-token changes may affect it, followed by regression verification.

## Responsive behavior

- Desktop layouts use the existing 1200 px content maximum and 24 px gutters where the containing route permits it.
- Product typography remains fixed rather than fluid.
- Two-column sections stack on mobile with primary content first.
- Tabs and filters remain horizontally usable without page-level overflow.
- All touched controls have a minimum 44 px touch target on mobile.
- Body and form text remain at least 16 px on mobile.

## Accessibility

- Meet WCAG AA contrast for body text and control labels in light and dark themes.
- Preserve semantic headings, field labels, button names, dialog descriptions, and keyboard order.
- Visible focus states are required on every touched interactive element.
- State is never communicated by color alone.
- Existing reduced-motion behavior remains intact; no decorative motion is introduced.

## Data and behavior boundaries

The redesign must not change:

- URLs or navigation destinations,
- Railway, Vercel, Docker, or database configuration,
- API request/response contracts,
- package, payment, referral, lesson, review, dispute, support, profile, or security business logic,
- room join timing,
- payment-method animation,
- homepage marquee/favorites functional animation,
- the existing single-navbar layout architecture.

## Implementation structure

1. Normalize shared theme and primitive mappings first.
2. Fix shared navigation/search/footer dark-mode behavior.
3. Refresh profile and move the referral utility.
4. Refresh payments and payment-method dialog.
5. Refresh security and account deletion.
6. Refresh lessons and join states.
7. Refresh support.
8. Fix homepage dark-mode component states.
9. Run focused tests after every surface, then the full test and type-check suites.
10. Verify representative desktop and mobile paths in both themes.

## Acceptance criteria

- No touched page uses navy or brown as an accidental theme surface.
- No unreadable text remains in the supplied dark-mode scenarios.
- Referral content appears below the profile identity card and no longer appears in payments.
- Gold is visible and meaningful on referral, lesson timing, and appropriate verification/offer contexts, always with `gold-ink`.
- “Derse katıl” remains readable in active, hover, disabled, and not-yet-open states.
- Account deletion uses the DESIGN.md error color and balanced sizing.
- Payment-method animation and every existing business action still work.
- The previous coaching changes remain intact.
- TypeScript passes.
- Focused tests for touched behavior pass.
- Full-suite failures, if any, are limited to already documented unrelated failures and are reported explicitly.

## Non-goals

- New referral rewards logic.
- Real card storage or payment-provider integration.
- New lesson, support, coaching, or security mechanics.
- Repository-wide icon migration unrelated to touched components.
- Redesigning checkout, messaging, tutor profiles, or the study calendar.
- Deployment or infrastructure changes.

