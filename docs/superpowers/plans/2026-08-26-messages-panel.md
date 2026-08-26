# Messages Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully functional desktop messages panel while preserving the existing full-screen mobile and route experience.

**Architecture:** Extend the existing conversation-list response with safe latest-message metadata, then extract the current route's thread implementation into a shared workspace consumed by both the route and a navbar popover. Keep panel selection as ephemeral client state and use the current React Query keys/API methods for all message behavior.

**Tech Stack:** Django REST Framework, Django ORM, Next.js 14 App Router, React 18, TanStack Query 5, Radix Popover, Tailwind CSS, Node test runner, Django TestCase.

**Spec:** `docs/superpowers/specs/2026-08-26-messages-panel-design.md`

## Global Constraints

- Do not add archive UI, archive state, a database migration, WebSocket support, Docker changes, URL rewrites, or environment variables.
- Desktop panel behavior applies only where the existing `md:flex` utility cluster is visible; mobile continues routing to `/messages`.
- Keep `YsNavbar` as the single instance in `src/app/(main)/layout.tsx`, above and sibling to `MainLayoutShell`.
- Keep `/messages` and `/messages/{conversationId}` as working full-screen routes.
- Never call a conversation's messages endpoint to populate inbox previews because that endpoint marks messages read.
- Use existing Hocam tokens and Turkish interface copy.

---

### Task 1: Safe latest-message conversation metadata

**Files:**
- Modify: `../Hocam_backend/apps/messaging/views.py`
- Modify: `../Hocam_backend/apps/messaging/serializers.py`
- Modify: `../Hocam_backend/apps/messaging/tests.py`

**Interfaces:**
- Produces: `ConversationSerializer.latest_message: null | { preview: string; created_at: string; sender_id: string; kind: "text" | "image" | "file" | "voice" | "deleted" }`.
- Produces: conversation list ordered by latest message creation time, with conversation creation time as fallback.
- Preserves: listing conversations does not mutate `Message.read_at`.

- [ ] **Step 1: Write failing backend contract tests**

Add tests to the existing messaging test case using its `_create_lesson_request_via_orm` helper:

```python
def test_conversation_list_includes_latest_message_without_marking_it_read(self):
    lr = self._create_lesson_request_via_orm()
    latest = Message.objects.create(
        conversation=lr.conversation,
        sender=self.tutor_user,
        message_text="Yarın 18.00 uygun.",
    )
    self.client.force_authenticate(self.student)

    response = self.client.get("/api/conversations/")

    item = next(row for row in response.data if row["id"] == str(lr.conversation.id))
    self.assertEqual(item["latest_message"], {
        "preview": "Yarın 18.00 uygun.",
        "created_at": latest.created_at.isoformat().replace("+00:00", "Z"),
        "sender_id": str(self.tutor_user.id),
        "kind": "text",
    })
    latest.refresh_from_db()
    self.assertIsNone(latest.read_at)

def test_conversation_list_orders_by_latest_activity(self):
    older = self._create_lesson_request_via_orm(message="older")
    newer = self._create_lesson_request_via_orm(message="newer")
    Message.objects.create(
        conversation=older.conversation,
        sender=self.tutor_user,
        message_text="most recent",
    )
    self.client.force_authenticate(self.student)

    response = self.client.get("/api/conversations/")

    self.assertEqual(response.data[0]["id"], str(older.conversation.id))
```

Cover `null`, deleted, image, generic file, and historical voice preview fallbacks with literal expected values. Extend the existing bounded-query test to assert the same maximum after latest-message loading.

- [ ] **Step 2: Run tests and verify RED**

Run: `rtk .venv/bin/python manage.py test apps.messaging.tests.MessagingFlowTests --keepdb`

Expected: latest-message tests fail because `latest_message` is absent; existing tests continue running.

- [ ] **Step 3: Implement bounded latest-message loading**

Use a `Prefetch` with an ordered message queryset and `to_attr="latest_messages"`, limited by a window/subquery-compatible approach already supported by the project's Django version, or annotate the latest message IDs/fields with `Subquery`. Apply the same queryset helper to list and retrieve views. Order by a `Coalesce` of latest-message time and conversation creation time, then by conversation ID for determinism.

Add a serializer method that reads only prefetched/annotated values:

```python
latest_message = serializers.SerializerMethodField()

def get_latest_message(self, instance):
    message = getattr(instance, "latest_message_value", None)
    if message is None:
        return None
    if message.is_deleted:
        preview, kind = "Mesaj silindi", "deleted"
    elif message.message_text.strip():
        preview, kind = message.message_text.strip(), "text"
    elif message.attachment and message.attachment.kind == "image":
        preview, kind = "Görsel", "image"
    elif message.attachment and message.attachment.kind == "voice":
        preview, kind = "Sesli mesaj", "voice"
    elif message.attachment:
        preview, kind = "Dosya", "file"
    elif message.image_url:
        preview, kind = "Görsel", "image"
    else:
        preview, kind = "Mesaj", "text"
    return {
        "preview": preview,
        "created_at": message.created_at,
        "sender_id": str(message.sender_id),
        "kind": kind,
    }
```

The actual implementation must not run a serializer-level message query.

- [ ] **Step 4: Run backend tests and verify GREEN**

Run the focused messaging test class, then the existing query-count test separately. Expected: all pass and the query bound is preserved.

- [ ] **Step 5: Commit the backend contract**

Stage only the three tracked messaging files and commit `feat: expose latest conversation activity` in `Hocam_backend`.

### Task 2: Conversation list presentation and filtering

**Files:**
- Modify: `src/types/api.ts`
- Create: `src/components/messaging/conversationPresentation.ts`
- Create: `src/components/messaging/conversationPresentation.test.ts`
- Modify: `src/components/messaging/ConversationList.tsx`

**Interfaces:**
- Consumes: optional `Conversation.latest_message` from Task 1.
- Produces: `filterConversations(conversations, "all" | "unread")`.
- Produces: `formatConversationActivity(iso, now?)` returning `HH:mm`, weekday, short date, or empty string.
- Produces: list rows with preview, activity time, participant, and unread badge.

- [ ] **Step 1: Write failing presentation tests**

```typescript
test("unread filtering uses the existing unread_count only", () => {
  assert.deepEqual(
    filterConversations([readConversation, unreadConversation], "unread").map((c) => c.id),
    ["unread"],
  );
});

test("activity formatting distinguishes today, this week, and older dates", () => {
  const now = new Date("2026-08-26T15:00:00+03:00");
  assert.equal(formatConversationActivity("2026-08-26T10:20:00+03:00", now), "10:20");
  assert.equal(formatConversationActivity("2026-08-25T10:20:00+03:00", now), "Sal");
  assert.equal(formatConversationActivity("2026-08-10T10:20:00+03:00", now), "10 Ağu");
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `rtk node --test --import tsx src/components/messaging/conversationPresentation.test.ts`

Expected: module/functions do not exist.

- [ ] **Step 3: Add types and pure presentation helpers**

Add the nullable `latest_message` shape to `Conversation`, implement literal `all`/`unread` filtering and Turkish activity formatting without reading browser globals.

- [ ] **Step 4: Update the real conversation rows**

Render `latest_message.preview` and formatted `latest_message.created_at`, falling back to `created_at` when no message exists. Keep the avatar profile link independently focusable, and move the unread count to the row's right metadata column so it matches the requested inbox hierarchy.

- [ ] **Step 5: Run the focused test and TypeScript check**

Run the new test, then `rtk npx tsc --noEmit`. Expected: pass with no type errors.

### Task 3: Shared full-feature conversation workspace

**Files:**
- Create: `src/components/messaging/ConversationWorkspace.tsx`
- Create: `src/components/messaging/threadPresentation.ts`
- Create: `src/components/messaging/threadPresentation.test.ts`
- Modify: `src/app/(main)/messages/[conversationId]/page.tsx`

**Interfaces:**
- Produces: `<ConversationWorkspace conversationId layout onBack />`, where `layout` is `"page" | "panel"`.
- Preserves: existing message, typing, attachment, reply, deletion, booking, block, SLA, complaint, and invalidation behavior.
- Produces: route page as a thin authenticated wrapper around the shared workspace.

- [ ] **Step 1: Extract and test pure thread grouping first**

Move `sameDay`, `formatDaySeparator`, `ThreadItem`, and `buildThreadItems` into `threadPresentation.ts`. Export them and add literal tests for day separators, sender grouping, and final-message time visibility.

- [ ] **Step 2: Verify the extraction test is RED before moving production code**

Run: `rtk node --test --import tsx src/components/messaging/threadPresentation.test.ts`.

Expected: missing module/export failure.

- [ ] **Step 3: Implement the pure extraction and verify GREEN**

Move the functions without behavior changes and run the focused test.

- [ ] **Step 4: Extract the route implementation into `ConversationWorkspace`**

Move all current hooks, refs, mutations, dialogs, message rendering, and input behavior into the shared component. Branch only layout classes and header controls:

```typescript
export interface ConversationWorkspaceProps {
  conversationId: string;
  layout: "page" | "panel";
  onBack?: () => void;
  onClose?: () => void;
  onExpand?: () => void;
}
```

In panel layout, hide the desktop conversation aside, use `h-full`, call `onBack` rather than route navigation, and keep every existing domain action. In page layout, preserve current responsive heights, sidebar, and mobile route-back behavior.

- [ ] **Step 5: Reduce the route page to the shared workspace wrapper**

```tsx
export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  return (
    <RouteGuard requireAuth>
      <ConversationWorkspace conversationId={params.conversationId} layout="page" />
    </RouteGuard>
  );
}
```

- [ ] **Step 6: Verify existing messaging behavior**

Run the thread-presentation test, existing MessageBubble/MessageInput tests, `rtk npx tsc --noEmit`, and ESLint on changed messaging files.

### Task 4: Desktop inbox panel and navbar trigger

**Files:**
- Create: `src/components/messaging/MessagesPanel.tsx`
- Create: `src/components/messaging/MessagesPanel.test.tsx`
- Modify: `src/components/yemeksepeti/YsNavIcons.tsx`
- Modify: `src/components/yemeksepeti/ysAppNav.ts`
- Modify: `src/components/yemeksepeti/ysAppNav.test.ts`

**Interfaces:**
- Consumes: `ConversationList`, `filterConversations`, and `ConversationWorkspace`.
- Produces: controlled `<MessagesPanel open onOpenChange />` mounted in the existing desktop utility cluster.
- Preserves: favorites as a Link and notifications as their current popover.

- [ ] **Step 1: Write failing panel behavior tests**

Render the real panel with a QueryClient and controlled fixtures. Assert:

```typescript
assert.ok(screen.getByRole("tab", { name: "Tümü" }));
assert.ok(screen.getByRole("tab", { name: /Okunmamış/ }));
assert.equal(screen.queryByText("Arşiv"), null);
fireEvent.click(screen.getByRole("button", { name: /sohbeti aç/ }));
assert.ok(screen.getByRole("button", { name: "Konuşma listesine dön" }));
```

Also assert inbox expand emits `/messages`, selected-thread expand emits `/messages/{id}`, and close resets selected conversation.

- [ ] **Step 2: Run the panel test and verify RED**

Run: `rtk node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/messaging/MessagesPanel.test.tsx`

Expected: component missing.

- [ ] **Step 3: Implement the panel**

Use the existing Radix `Popover` controlled state. The content uses `w-[min(31rem,calc(100vw-2rem))]`, approved height constraints, zero inner padding, Hocam surface/border/shadow tokens, and contained overflow. The inbox owns only `activeTab` and `selectedConversationId`; React Query owns server state.

- [ ] **Step 4: Replace only the desktop message Link**

Identify the message utility item explicitly and render `MessagesPanel` for it. Keep other utility items as Links. Add an unread badge using the sum of existing conversation unread counts. The message trigger must not call `router.push` when opening.

- [ ] **Step 5: Keep mobile route data explicit**

Do not remove the `/messages` navigation item from `YS_UTILITY_ITEMS`; only the desktop renderer changes its behavior. Update nav tests to confirm the route remains `/messages` and no archive item appears.

- [ ] **Step 6: Run panel/nav tests and static checks**

Run the new panel test, `ysAppNav.test.ts`, `rtk npx tsc --noEmit`, and changed-file ESLint.

### Task 5: Full integration and visual verification

**Files:**
- Modify only if a verified defect requires it: files changed in Tasks 1–4.

**Interfaces:**
- Verifies the approved user journey across frontend and backend.

- [ ] **Step 1: Run focused backend messaging tests**

Run the affected Django messaging test class and query-count test. Expected: all green.

- [ ] **Step 2: Run focused frontend messaging/nav tests**

Run all new tests plus existing MessageBubble, MessageInput, notification appearance, and navbar tests. Expected: all green.

- [ ] **Step 3: Run repository static verification**

Run TypeScript no-emit and ESLint on every changed frontend source/test file. Run Django system check. Expected: no new warnings or errors.

- [ ] **Step 4: Verify in a real browser at desktop and mobile widths**

At desktop: open the panel from `/`, switch tabs, open a conversation, send a message, return to list, expand, close, press Escape, and confirm the underlying URL is unchanged until expand. At mobile: use the message entry point and confirm it routes to `/messages` with no floating panel.

- [ ] **Step 5: Capture final evidence and inspect diffs**

Save desktop inbox and thread screenshots. Review both repository diffs, ensure no archive/migration/Docker/env files changed, and ensure all pre-existing unrelated worktree files remain untouched.

