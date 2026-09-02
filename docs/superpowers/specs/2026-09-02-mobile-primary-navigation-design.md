# Mobile Primary Navigation Design

## Scope

This design changes only compact/mobile presentation. Desktop navigation and desktop journey-heading layout remain unchanged.

## Mobile navigation

Authenticated student order is `Hocalar`, `Panelim`, `Mesajlar`, `Bildirimler`, `Daha Fazla`. Authenticated tutor order is `Hocalar`, `Panom`, `Mesajlar`, `Bildirimler`, `Daha Fazla`.

`Hocalar` points to `/`, matching the current rebranded desktop information architecture. `Panelim`/`Panom` is promoted from overflow because it is the user's primary personal workspace. Feature-flagged destinations and `Favoriler` remain in `Daha Fazla`.

The bar spans the full compact viewport, accounts for the bottom safe area, and distributes five destinations with equal weight. It uses a solid surface and a top hairline, with no blur or translucency.

Icons use Phosphor at 20px. Inactive icons use `regular`; active route icons use `fill` and sit on an ink pill. Labels remain visible. No pink underline, stripe, or accent bar is used.

`Daha Fazla` opens as a bottom sheet containing the remaining routes. Selecting a route closes the sheet.

## Journey heading

Below the `md` breakpoint, the heading always has two stable rows: `Sen sadece` on the first and the animated pink word pill on the second. The animated slot reserves the size of its longest state so changing between `seç`, `gün belirle`, `derse gir`, and `öğren` cannot reflow the heading or move the content below it. Desktop remains horizontal.

Reduced-motion behavior and the stable accessible sentence remain unchanged.

## Booking selection

Selected date and selected time controls use the DESIGN.md primary pairing: pink surface with white foreground. Gold is not used as text and black/ink text never appears on pink.

## Acceptance criteria

- No duplicate `Ana Sayfa` mobile destination remains.
- The five visible mobile destinations fill the whole width evenly for students and tutors.
- Primary/overflow routes respect feature flags and role restrictions.
- The active route uses the DESIGN.md Phosphor filled-state treatment.
- The mobile journey heading does not change row count as the word rotates.
- Selected mobile date and time text is white on pink.
- Desktop layouts and routes are unchanged.
