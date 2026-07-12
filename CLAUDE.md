# Hocam — Frontend

> **Active direction:** Before selecting or planning work, read
> [`docs/current-product-and-technical-state.md`](docs/current-product-and-technical-state.md).
> This architecture overview is not the source of current priorities or product-policy decisions.

> ⚠️ **AI ajanları: Herhangi bir değişiklik yapmadan önce bu repodaki `AI_AGENT_RULES.md`
> dosyasını oku.** Ödeme/checkout kuralları ve "bu bir bug değil, kasıtlı" listesi orada — bu
> dosyadaki genel mimari özetinden daha güncel ve daha bağlayıcı. Çelişki varsa
> `AI_AGENT_RULES.md` kazanır.

Next.js 14 frontend for Hocam, a peer-to-peer tutoring marketplace for Turkish students preparing for the YKS university entrance exam. Talks to a Django REST API hosted on Railway.

## Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- axios (with interceptors)
- react-hook-form + zod
- @tanstack/react-query (all data fetching)
- js-cookie

## Project Structure

```
frontend/src/
  app/
    (auth)/
      layout.tsx          — standalone layout, no navbar
      login/page.tsx
      register/page.tsx
    (main)/
      layout.tsx          — root layout with Navbar + Footer
      page.tsx            — integrated login/register entry screen
      tutors/page.tsx
      tutors/[id]/page.tsx
      dashboard/student/page.tsx
      dashboard/tutor/page.tsx
      messages/page.tsx
      messages/[conversationId]/page.tsx
  components/
    ui/                   — shadcn/ui primitives
    layout/               — Navbar, Footer
    tutors/               — TutorCard, TutorFilters, ReviewCard, LessonRequestModal,
                            AvailabilityEditor, VerificationForm
    lessons/              — BookingCard, LessonRequestCard, ReviewModal, BookingModal
    messaging/            — ConversationList, MessageBubble, MessageInput
    shared/               — LoadingSpinner, ErrorMessage, EmptyState, StatusBadge, RouteGuard
  lib/
    api.ts                — axios instance with auth headers + 401 interceptor
    authApi.ts            — register, login, fetchMe
    tutorsApi.ts          — fetchTutors, fetchSubjects, fetchTutorById, fetchTutorReviews
    lessonsApi.ts         — createLessonRequest, fetchLessonRequests, fetchBookings,
                            updateBookingStatus, createBooking
    dashboardApi.ts       — fetchAvailability, createAvailabilityRule, deleteAvailabilityRule,
                            fetchVerification, submitVerification, fetchTutorAvailability
    reviewsApi.ts         — createReview
    messagingApi.ts       — fetchConversations, fetchMessages, sendMessage
    queryClient.ts
    utils.ts              — cn, formatPrice, formatRating, formatDate
  hooks/
    useAuth.ts
    useUser.ts
  providers/
    AuthProvider.tsx      — auth state, rehydrates via /api/auth/me/ on mount
    QueryProvider.tsx
  types/
    api.ts                — all TypeScript interfaces (use these, never inline types)
    index.ts
```

## Auth Flow

1. Token stored in `auth_token` cookie (7-day expiry, js-cookie)
2. User object stored in localStorage as `auth_user` (backup/sync)
3. On app mount: `AuthProvider` calls `/api/auth/me/` to get fresh user from server
4. On 401 response: axios interceptor clears the cookie and redirects to `/login`
5. After login/register: `fetchMe()` called immediately → `setAuth(user, token)` → redirect to role dashboard

Note: `auth_token` is set with js-cookie (not HttpOnly). This means it's accessible to JavaScript. Known security limitation — acceptable for now.

## Route Protection

`RouteGuard` wraps all protected pages:
- While loading: full-page `LoadingSpinner`
- `requireAuth` + not authenticated → redirect to `/login`
- `requireRole="student"` + user is tutor → redirect to `/dashboard/tutor`
- `requireRole="tutor"` + user is student → redirect to `/dashboard/student`

## Data Fetching Rules

- **All** data fetching via `@tanstack/react-query` — never use `useEffect + fetch`
- Messaging uses polling (not WebSockets): conversations list refetches every 30s, message thread every 5s
- Tutor list filter state lives in URL search params — filters are bookmarkable and shareable
- Optimistic updates on message send: new messages appear instantly before server confirms

Do not change messaging to WebSockets without an explicit plan. The polling is intentional.

## Booking Flow (3-step modal)

`BookingModal` in `components/lessons/`:

**Step 1** — Select subject. Standard package lessons use the fixed 40-minute credit duration; free trials are 20 minutes.

**Step 2** — Select date from the next 14 days (days without availability rules are disabled), then pick a time slot generated from availability rules minus the booking duration

**Step 3** — Confirm summary and submit

### Critical date/time rules:
- `start_time` is sent to the backend as a **local ISO string WITHOUT the Z suffix** (e.g. `"2024-06-15T14:00:00"` not `"2024-06-15T14:00:00Z"`). The backend treats it as local time.
- **day_of_week conversion:** JavaScript's `getDay()` returns 0=Sunday. The backend uses 0=Monday (Python weekday convention). Always convert with: `(jsDay + 6) % 7`

## Messaging

- Conversations are only created via the lesson request flow — there is no "start a conversation" button
- `ConversationList` displays "Konuşma #XXXXXX" format (last 6 chars of conversation UUID, uppercased)
- `MessageBubble`: own messages right-aligned (primary color), other messages left-aligned (muted)
- Enter to send, Shift+Enter for newline
- Optimistic messages are merged with server messages and deduplicated by `id`

## Feedback UX Rules

Every user-facing feedback message uses exactly one of three tiers — pick by severity, proximity, and flow:

1. **Toast (sonner)** — low-stakes, ephemeral, non-blocking feedback after user actions ("Profil bağlantısı kopyalandı.", "Ayarlar kaydedildi.", "Bildirim silindi."). Import `toast` from `"sonner"` directly; the `<Toaster richColors position="top-right" />` lives in `src/app/layout.tsx`. Toasts must NEVER be stored as notification-center items.
2. **Inline error** — the default for everyday errors: form validation and field-specific problems, rendered next to the related field/button (react-hook-form + zod `FormMessage`, or `ErrorMessage` from `components/shared/` for general form errors). Never use a toast when the user must look back at a specific field, and never a modal for ordinary validation. Don't double-report (inline + toast) the same error.
3. **Modal dialog** — only for blocking issues that prevent continuing (session expired, payment failure, access denied). Must offer a clear path forward (Retry / Giriş yap / Kapat). Session expiry: the 401 interceptor in `src/lib/api.ts` dispatches `SESSION_EXPIRED_EVENT`; `SessionExpiredDialog` (mounted in root layout) handles it.

Notification center rules:
- Reserved for real app notifications the user may return to later (new message, booking/lesson-request updates, reminders). System/action feedback never goes there.
- The popover shows **unread only**; clicking marks read and routes via `related_object_type`.
- **Privacy:** message notifications must never show message content — `NotificationPopoverContent` replaces the body of `type === "message"` notifications with a generic line. Keep it that way.

All user-facing feedback text is Turkish.

## TypeScript Types

All types live in `src/types/api.ts`. Always import from there — never define inline types for API data.

```typescript
User { id, email, role: "student" | "tutor", tutor_profile_id?: string }
TutorProfile { id, user, name, surname, profile_picture, bio, university, department,
               yks_rank, hourly_price, rating, total_reviews, is_verified,
               subjects: Subject[], created_at }
Subject { id, name, exam_type: "TYT" | "AYT" }
LessonRequest { id, student, tutor, subject, message,
                status: "pending"|"accepted"|"declined", created_at }
Booking { id, student, tutor, subject, start_time, duration_minutes, price,
          status: "pending"|"confirmed"|"completed"|"cancelled",
          lesson_request, created_at }
Conversation { id, lesson_request, student, tutor, created_at }
Message { id, conversation, sender, message_text, created_at }
Review { id, booking, student, tutor, rating, comment, created_at }
AvailabilityRule { id, tutor, day_of_week, start_time, end_time, created_at }
TutorVerification { id, tutor, student_id_document, yks_result_document,
                    university_email, status: "pending"|"approved"|"rejected",
                    submitted_at, reviewed_at }
```

## API Modules

All API calls go through the shared axios instance in `lib/api.ts` which automatically:
- Attaches `Authorization: Token <token>` header from the cookie
- Catches 401 responses, clears auth state, and redirects to `/login`

Add new API calls to the appropriate `lib/*Api.ts` file — never put axios calls directly in components or pages.

## Environment Variables

```
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api   # local dev

# Vercel (production)
NEXT_PUBLIC_API_URL=https://your-app.railway.app/api
```

Note: `.env.local` is git-ignored and never committed. For local development set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` in it (when unset, `src/lib/api.ts` falls back to the Railway production API in production builds and localhost in dev).

## Development

```bash
cd frontend
npm run dev       # Next.js dev server at :3000
```

Or from the project root: `./dev.sh` (runs Django + Next.js together via concurrently).

## Deployment (Vercel)

- Auto-deploys on push to `main` branch of `HocamApp/hocam-frontend`
- Vercel auto-detects Next.js — no build config needed
- Set `NEXT_PUBLIC_API_URL` in Vercel environment variables dashboard

## Known Issues

### MESSAGING USES POLLING
Conversations list polls every 30s, message thread polls every 5s. Not WebSockets. There is a ~5s message delivery delay. This is intentional for now — do not add WebSocket/Supabase Realtime without a deliberate plan.

### AUTH TOKEN IS NOT HTTPONLY
`auth_token` cookie is set via js-cookie and is accessible to JavaScript. An XSS vulnerability would expose it. Acceptable for early stage but should be replaced with HttpOnly cookie + refresh token before scaling.

## Work selection

Do not choose new frontend work from this architecture overview. Follow
`docs/current-product-and-technical-state.md` and `AI_AGENT_RULES.md`; current video uses
JaaS through `/session/[bookingId]`, not Zoom or Daily.co.

## Video Sessions (JaaS)

`app/session/[bookingId]/page.tsx` embeds the lesson video call in-page via `@jitsi/react-sdk`'s `JitsiMeeting`, backed by JaaS (8x8 Jitsi-as-a-Service) rather than the public `meet.jit.si`.

- The room only exists once `Booking.room_url` is set (on confirm — see backend `CLAUDE.md`).
- The page calls `fetchSessionToken(bookingId)` (`lib/lessonsApi.ts`) to get a short-lived per-user JWT + room name + domain from `GET /api/bookings/{id}/session-token/`, then passes `jwt`, `roomName`, `domain` to `JitsiMeeting`. There is no client-side JaaS config (app ID, keys) — it all comes from that endpoint.
- **Every** "join session" link across the app must point at `/session/{bookingId}` (in-app, embedded) — never link directly to `booking.room_url` with `target="_blank"`. That was a past bug (raw meet.jit.si link, unbranded, new tab) fixed across `BookingCard.tsx`, the tutor dashboard, `profile/lessons/upcoming`, and `profile/calendar`.
- Actual visual branding (logo, colors) is configured in the JaaS console (per `JAAS_APP_ID` tenant), not in this code. The `interfaceConfigOverwrite` flags here (hiding watermarks, background color) only take effect because we're on JaaS with a valid JWT — they're silently ignored on the public `meet.jit.si` server.
