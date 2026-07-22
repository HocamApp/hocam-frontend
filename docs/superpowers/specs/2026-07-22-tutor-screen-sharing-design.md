# Tutor Screen Sharing Design

## Goal

Allow tutors to start and stop browser screen sharing during a live JaaS/Jitsi lesson from a prominent Hocam header control. Keep the student-facing lesson interface free of a screen-sharing control for now.

## Scope

- Change only `src/app/session/[bookingId]/page.tsx`.
- Add a tutor-only header button next to the existing Whiteboard control. Its initial label is `Ekran paylaş`; while the tutor is sharing, its label becomes `Paylaşımı durdur`.
- The button calls Jitsi's official iframe command `toggleShareScreen` and uses the existing "room is preparing" and error-toast patterns.
- Add Jitsi's official `desktop` toolbar control only for tutors, alongside the existing tutor-only `whiteboard` control.
- Subscribe to the official screen-sharing participant event so the header label follows the tutor's actual share state, including when sharing is stopped from inside Jitsi or by the browser chooser.

## Deliberate Product Decisions

- Students will not see the Hocam header button or Jitsi's `desktop` toolbar control.
- This is UI-level role scoping. Jitsi documents a `D` screen-sharing keyboard shortcut; a hard per-participant prohibition would require separate JaaS/Jitsi policy work and is not part of this task.
- No custom screen-sharing implementation, iframe DOM/CSS manipulation, browser API integration, backend change, migration, new dependency, or payment/booking/auth change.
- Existing question invitation/panel, tutor-only Whiteboard behavior, microphone, camera, chat, tile view, and hangup controls remain unchanged.

## Error Handling and Accessibility

- If Jitsi's API has not initialized, show the existing informational toast rather than failing silently.
- If the command throws, show a Turkish error toast.
- The standard button has an icon and visible label; its label reports the active state.

## Verification

1. Add a focused test for the role-specific toolbar/button state before implementation and observe it fail.
2. Run the relevant unit tests after implementation, then `npm run test:unit`, `npm run lint`, `npm run build`, and `git diff --check`.
3. If a valid two-user JaaS lesson is available, verify that the tutor can choose a screen/window/tab, the student sees the shared screen, and stopping from either the header or Jitsi updates the header label. Otherwise report that this live verification remains pending.
