# Tutor Screen Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a tutor start and stop browser screen sharing from the live lesson header while keeping screen-sharing UI hidden from students.

**Architecture:** A small pure helper owns role-aware Jitsi toolbar composition, safe parsing of Jitsi local sharing events, and the header action label. The live lesson page calls Jitsi's official `toggleShareScreen` command and uses `screenSharingStatusChanged` to keep the header state correct.

**Tech Stack:** Next.js 14, React, TypeScript, `@jitsi/react-sdk`, Node test runner through `tsx`, Lucide, Sonner.

## Global Constraints

- Video stays JaaS / 8x8 Jitsi at `/session/[bookingId]`; no Daily.co, Zoom, WebSocket, custom iframe DOM/CSS access, or browser screen-capture code.
- No backend, migration, authentication, payment, booking-lifecycle, dependency, or Notion change.
- Tutors see the header control and Jitsi `desktop` toolbar item; students see neither.
- Keep microphone, camera, chat, tile view, hangup, tutor-only Whiteboard, tutor notes, and live-question behavior unchanged.
- Use Jitsi's official `toggleShareScreen` command and `screenSharingStatusChanged` event.
- The student restriction is UI-level only; do not claim Jitsi keyboard shortcuts are hard-blocked.
- Do not touch `src/lib/.impeccable/`.

---

## File Structure

- Create `src/lib/jitsiSessionControls.ts`: pure role-aware toolbar, event parser, and label helper.
- Create `src/lib/jitsiSessionControls.test.ts`: pure unit tests for all helper behavior.
- Modify `src/app/session/[bookingId]/page.tsx`: tutor-only action, Jitsi event subscription, helper use.
- Modify `package.json`: include the new test in `npm run test:unit`.

### Task 1: Test and implement the role-aware control helper

**Files:**

- Create: `src/lib/jitsiSessionControls.ts`
- Create: `src/lib/jitsiSessionControls.test.ts`
- Modify: `package.json:12`

**Interfaces:**

- Produces `getLessonJitsiToolbarButtons(role: "student" | "tutor" | undefined): string[]`.
- Produces `screenSharingStateFromEvent(event: unknown): boolean | null`.
- Produces `getScreenShareButtonLabel(isSharing: boolean): "Ekran paylaş" | "Paylaşımı durdur"`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/jitsiSessionControls.test.ts` with this exact test:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getLessonJitsiToolbarButtons,
  getScreenShareButtonLabel,
  screenSharingStateFromEvent,
} from "./jitsiSessionControls";

describe("lesson Jitsi screen-sharing controls", () => {
  it("shows desktop sharing only in the tutor toolbar", () => {
    assert.deepEqual(getLessonJitsiToolbarButtons("tutor"), [
      "microphone", "camera", "chat", "whiteboard", "desktop", "tileview", "hangup",
    ]);
    assert.deepEqual(getLessonJitsiToolbarButtons("student"), [
      "microphone", "camera", "chat", "tileview", "hangup",
    ]);
  });

  it("reads the official Jitsi local sharing event safely", () => {
    assert.equal(screenSharingStateFromEvent({ on: true }), true);
    assert.equal(screenSharingStateFromEvent({ on: false }), false);
    assert.equal(screenSharingStateFromEvent({}), null);
    assert.equal(screenSharingStateFromEvent(null), null);
  });

  it("uses action text that reflects the local sharing state", () => {
    assert.equal(getScreenShareButtonLabel(false), "Ekran paylaş");
    assert.equal(getScreenShareButtonLabel(true), "Paylaşımı durdur");
  });
});
```

Append `src/lib/jitsiSessionControls.test.ts` to the `tsx --test` list in `package.json`.

- [ ] **Step 2: Run the test and verify RED**

Run `npm run test:unit`.

Expected: failure reporting that `./jitsiSessionControls` cannot be resolved; existing suites still run.

- [ ] **Step 3: Write the minimal helper**

Create `src/lib/jitsiSessionControls.ts`:

```ts
export type LessonParticipantRole = "student" | "tutor" | undefined;

export function getLessonJitsiToolbarButtons(role: LessonParticipantRole) {
  return [
    "microphone",
    "camera",
    "chat",
    ...(role === "tutor" ? ["whiteboard", "desktop"] : []),
    "tileview",
    "hangup",
  ];
}

export function screenSharingStateFromEvent(event: unknown): boolean | null {
  if (!event || typeof event !== "object" || !("on" in event)) return null;
  return typeof event.on === "boolean" ? event.on : null;
}

export function getScreenShareButtonLabel(isSharing: boolean) {
  return isSharing ? "Paylaşımı durdur" : "Ekran paylaş";
}
```

- [ ] **Step 4: Run the focused GREEN test**

Run `npx tsx --test src/lib/jitsiSessionControls.test.ts`.

Expected: 3 pass, 0 fail.

- [ ] **Step 5: Commit the helper**

Run `git add package.json src/lib/jitsiSessionControls.ts src/lib/jitsiSessionControls.test.ts` and `git commit -m "Add tutor screen sharing controls"`.

### Task 2: Connect the helper to the live Jitsi lesson

**Files:**

- Modify: `src/app/session/[bookingId]/page.tsx:1-40, 200-230, 360-425, 455-515`
- Test: `src/lib/jitsiSessionControls.test.ts`

**Interfaces:**

- Consumes `getLessonJitsiToolbarButtons`, `screenSharingStateFromEvent`, and `getScreenShareButtonLabel` from `@/lib/jitsiSessionControls`.
- Consumes existing `JitsiApi.executeCommand` and `JitsiApi.addEventListener`.

- [ ] **Step 1: Add imports and local state**

Import `MonitorUp` from `lucide-react` and the three helpers from `@/lib/jitsiSessionControls`. Near `notesPanelOpen`, add `const [isScreenSharing, setIsScreenSharing] = useState(false);`.

- [ ] **Step 2: Add the minimal Jitsi command handler**

Next to `handleToggleWhiteboard`, add:

```ts
const handleToggleScreenShare = () => {
  if (!jitsiApi?.executeCommand) {
    toast.info("Ders odası hazırlanıyor. Birkaç saniye sonra tekrar dene.");
    return;
  }

  try {
    jitsiApi.executeCommand("toggleShareScreen");
  } catch {
    toast.error("Ekran paylaşımı şu anda açılamadı.");
  }
};
```

- [ ] **Step 3: Add tutor-only header action and toolbar item**

Replace the inline toolbar list with `const jitsiToolbarButtons = getLessonJitsiToolbarButtons(user?.role);`.

Immediately before the existing tutor-only Whiteboard button, render:

```tsx
{user?.role === "tutor" && (
  <button
    onClick={handleToggleScreenShare}
    className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
  >
    <MonitorUp className="h-3.5 w-3.5" aria-hidden="true" />
    {getScreenShareButtonLabel(isScreenSharing)}
  </button>
)}
```

- [ ] **Step 4: Synchronize the header from Jitsi's local event**

Inside existing `onApiReady`, after `setJitsiApi(api)`, register:

```ts
api.addEventListener?.("screenSharingStatusChanged", (event) => {
  const sharing = screenSharingStateFromEvent(event);
  if (sharing !== null) setIsScreenSharing(sharing);
});
```

Leave reconnect listeners unchanged. The event covers the header action, Jitsi `desktop` action, and browser-driven stopping.

- [ ] **Step 5: Verify full frontend checks**

Run, separately: `npm run test:unit`, `npm run lint`, `npm run build`, and `git diff --check`.

Expected: all unit suites pass; lint has no errors (the known unrelated tutor-profile `<img>` warning may remain); build exits 0; diff check prints nothing.

- [ ] **Step 6: Run live acceptance checks only if an active JaaS booking and two accounts exist**

Join as tutor and student. Tutor sees the header action, Whiteboard, and `desktop`; student sees neither screen-share entry point. Tutor shares a tab/window/screen and student sees it; label changes to `Paylaşımı durdur`. Stop through the browser chooser or Jitsi and verify the label returns to `Ekran paylaş`. If the test setup is unavailable, report this check as pending rather than inventing a result.

- [ ] **Step 7: Commit the integration**

Run `git add src/app/session/[bookingId]/page.tsx` and `git commit -m "Add tutor screen sharing in live lessons"`.
