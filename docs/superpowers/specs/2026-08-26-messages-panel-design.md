# Messages Panel Design

**Date:** 2026-08-26  
**Status:** Approved  
**Repositories:** `Hocam_frontend_yemeksepeti`, `Hocam_backend`

## Goal

Change the signed-in desktop message icon from a route-only link into a compact, right-aligned inbox that can open and operate a full conversation without changing the current URL. Preserve the existing `/messages` and `/messages/{conversationId}` pages as the mobile experience and the panel's full-screen destination.

## Product boundaries

- Desktop uses the panel at the same breakpoint where the desktop utility icon cluster is visible.
- Mobile keeps the existing full-screen `/messages` navigation.
- The panel has only `Tümü` and `Okunmamış` tabs.
- There is no archive tab, archive action, archive persistence, or new conversation state.
- The panel reuses the existing message system: read state, polling, typing, sending, attachments, replies, deletion, booking, blocking, and current authorization rules.
- Opening the panel does not change the URL. Opening full screen navigates to `/messages` or `/messages/{conversationId}`.
- Refreshing the page closes the panel; its open state and selected conversation are intentionally ephemeral UI state.

## Chosen architecture

The existing full-screen thread page and the new panel will share a single conversation workspace rather than maintaining two message implementations. The route page supplies full-screen layout/navigation, while the panel supplies compact layout, back, close, and expand controls. Both surfaces use the same React Query keys and existing REST endpoints so cached data, read state, polling, mutations, and invalidations stay consistent.

The conversation list endpoint will gain read-only latest-message metadata. This is an extension of the existing response, not a new message mechanism or database model. Fetching every thread to build previews is forbidden because `GET /conversations/{id}/messages/` currently marks incoming messages read and would also create an N+1 request pattern.

## Desktop interaction

### Closed state

The message icon remains visually uncontained in the navbar. It keeps its existing active/fill treatment on message routes and receives an unread-count badge derived from the existing `Conversation.unread_count` values.

### Inbox state

The panel is anchored below and to the right of the desktop navbar:

- Width: `min(31rem, calc(100vw - 2rem))`.
- Height: `min(48rem, calc(100dvh - var(--app-header-h) - 1.5rem))`.
- Header: `Mesajlar`, expand button, close button.
- Tabs: `Tümü`, `Okunmamış` plus the existing unread total.
- Rows: participant avatar, name, latest-message preview, latest-message time, and unread badge.
- Empty unread state: `Okunmamış mesajınız yok.`
- Loading and error states remain actionable and contained inside the panel.

`Tümü` contains every existing conversation. `Okunmamış` is a client-side filter where `unread_count > 0`; it does not introduce a new backend filter or state.

### Thread state

Selecting a row replaces the list body with the conversation workspace inside the same panel. The header becomes a compact thread header with back, participant identity, expand, and close controls. Existing message actions remain available; controls may wrap or move into the existing overflow treatment to fit the compact width, but their behavior and permissions do not change.

The expand button navigates to `/messages/{conversationId}`. From the inbox state it navigates to `/messages`.

### Dismissal and accessibility

- Close button, Escape, and outside click close the panel.
- Focus returns to the message icon after close.
- The trigger exposes `aria-expanded`, `aria-controls`, and an unread-aware label.
- Panel controls have Turkish accessible labels.
- Keyboard focus remains visible; reduced-motion preference disables the list/thread transition.

## Mobile interaction

Below the existing desktop utility-nav breakpoint, the app does not mount the floating panel. Message entry points continue to navigate to `/messages`, and conversation selection continues to navigate to `/messages/{conversationId}`. This preserves usable viewport width, browser history, and the current mobile back behavior.

## Visual direction

The panel belongs to Hocam's rebranded shell, not to Preply. Preply is a behavioral reference only.

- Brand pink: `#fa0050` (`--pink`) for the active tab indicator and controlled focus/accent moments.
- Paper: `#fbf6f6` (`--paper`) behind the floating surface.
- Surface: `#ffffff` (`--surface`) for the panel and message composer.
- Ink: `#02171a` (`--ink`) for primary copy and unread badges.
- Muted ink: `#5c6b6d` (`--ink-mid`) for previews and timestamps.
- Divider: `#e6dddd` (`--line`) for row and header separation.

Typography remains the existing application typography. The panel uses the existing radius and shadow tokens, with a disciplined flat hierarchy: one elevated outer surface, hairline internal dividers, and no nested decorative cards. The signature interaction is the in-place list-to-thread transition; all other motion stays quiet.

## API contract

`ConversationSerializer` adds:

```json
{
  "latest_message": {
    "preview": "Yarın 18.00 benim için uygun.",
    "created_at": "2026-08-26T12:34:56Z",
    "sender_id": "uuid",
    "kind": "text"
  }
}
```

Rules:

- `latest_message` is `null` when the conversation has no messages.
- `preview` uses the message text when present.
- Image-only messages use `Görsel`.
- File-only messages use `Dosya`.
- Historical voice-only messages use `Sesli mesaj`.
- Soft-deleted latest messages use `Mesaj silindi` and never expose deleted text.
- The list queryset prefetches or annotates the latest message in a bounded query count.
- Reading the conversation list never changes `read_at` or notification state.
- Conversations are ordered by latest message time, falling back to conversation creation time.

The frontend `Conversation` type mirrors this optional nullable object so deployment remains backward compatible while the frontend and backend roll out.

## Data flow

1. The desktop navbar uses the shared `['conversations']` query while the user is authenticated and the page is visible.
2. Opening the panel reads the cached list immediately and continues the existing 60-second polling cadence.
3. Selecting a thread activates the existing `['conversation', id]`, `['messages', id]`, and typing queries.
4. Fetching the selected thread preserves today's behavior: incoming unread messages are marked read.
5. Successful sends, deletes, or thread reads invalidate the shared conversation list so previews, ordering, and unread counts update in both panel and full screen.

## Deployment and infrastructure

- No database model or migration is added.
- No Dockerfile, domain, URL rewrite, environment variable, or WebSocket change is required.
- The backend serializer/query update requires a normal Railway backend deploy.
- The panel and shared components require a normal Vercel frontend deploy.
- Existing API base URLs and authentication cookies remain unchanged.

## Error handling

- A failed conversation list shows the existing Turkish retry/error treatment inside the panel without closing it.
- A failed thread load keeps the compact header and offers retry/back rather than navigating away.
- Failed mutations continue using the current toasts and local optimistic-state rollback behavior.
- A conversation that becomes unauthorized closes the thread view back to the list after the existing API error is surfaced.

## Test strategy

### Backend

- Serializer returns the correct latest text, attachment fallback, deleted preview, and `null` state.
- Listing conversations does not mark messages read.
- Conversation ordering follows latest activity.
- Query count stays bounded as the list grows.

### Frontend

- Desktop trigger opens the panel without route navigation.
- Mobile entry remains a link to `/messages`.
- Tabs filter using existing unread counts; no archive UI is rendered.
- Conversation selection switches to the shared thread workspace.
- Expand routes to the list or selected thread as appropriate.
- Close/Escape restore the trigger and do not modify the URL.
- Existing full-screen messaging tests and current notification/nav tests remain green.

## Acceptance criteria

1. On desktop, clicking the navbar message icon opens the right-side inbox without changing the current URL.
2. The panel shows `Tümü` and `Okunmamış`, real conversation metadata, latest-message preview/time, and unread count.
3. Selecting a conversation provides the existing fully functional message experience inside the panel.
4. Expand opens the existing full-screen route; close returns to the underlying page.
5. On mobile, message navigation stays full-screen.
6. No archive mechanism, database migration, WebSocket, Docker, or environment change is introduced.
7. Conversation previews do not mark messages read and do not create an N+1 messages request pattern.
