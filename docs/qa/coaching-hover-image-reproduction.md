# Tutor dashboard image / hover investigation

Date: 2026-08-12
Route: `/dashboard/tutor`
Account class: authenticated local QA tutor
Production access: none

## Result

**NO FIX. The reported defect was not reproduced, so no tutor-dashboard production code was changed.**

The browser run used the real dashboard, avatar, booking-card and
`StudentRosterCard` components with intercepted local/test API responses. The
same 2400×1600 repository image was supplied for the tutor and student so the
request, decode, layout and hit-testing path could be measured without an
external dependency.

## Matrix

| Viewport / input | Student card box | Topmost point belongs to card | Pointer events / z-index | Image request and decode | Click | Keyboard |
|---|---:|---|---|---|---|---|
| 375×812 / touch emulation | 343×106 | Yes (`P`) | `auto` / `auto` | HTTP 200; 2400×1600 | Dialog opened | Enter opened dialog |
| 768×1024 / pointer | 736×106 | Yes (`DIV`) | `auto` / `auto` | HTTP 200; 2400×1600 | Dialog opened | Enter opened dialog |
| 1440×900 / pointer | 1120×106 | Yes (`DIV`) | `auto` / `auto` | HTTP 200; 2400×1600 | Dialog opened | Enter opened dialog |

The dashboard-header image rendered at 34×34 and the booking participant image
at 48×48 in every viewport. Both decoded to the expected 2400×1600 natural
size, with `pointer-events: auto` and `z-index: auto`. The student roster image
also decoded at that natural size. No overlay intercepted the center hit-test.

No Next error overlay, page error, actionable browser console error or
hydration error was observed in the completed run. A distinct “reported result card” was not
present in the local tutor fixture, so no claim is made about an unidentified
component.

## Evidence

- `screenshots/coaching-qa/tutor-dashboard-hover-375.png`
- `screenshots/coaching-qa/tutor-dashboard-hover-768.png`
- `screenshots/coaching-qa/tutor-dashboard-hover-1440.png`
- Reproducible command: `npm run coaching:qa`

The screenshots are generated QA artifacts and remain gitignored. The durable
evidence is the deterministic browser harness in `scripts/coaching-qa.ts` and
this record.
