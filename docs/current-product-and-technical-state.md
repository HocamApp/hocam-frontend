# HOCAM — Current Product & Technical State

**Status date:** 22 July 2026
This is the active product and technical direction for Hocam. It supersedes earlier roadmaps and M3 handoffs when they conflict; those documents are historical context only.

## Direction

- Hocam is a verified YKS tutor marketplace. Only verified, high-ranking tutors are publicly visible and bookable.
- The sole paid-learning model is a package-credit model: weekly lessons (2–6) × a 14/30/90/180-day duration. One-off paid lessons and ten-lesson packages are retired.
- A package, credit, or ledger record is not proof of a live payment. No payment provider is connected.
- `MANUAL_PAYMENT_ACTIVATION_ENABLED` remains disabled until written founder approval after G0/G1 reconciliation and the payment-provider plan are complete.
- Production email/password registration requires the 6-digit verification code. Resend sends from the verified `hocamozelders.com` domain, password-reset links use `www.hocamozelders.com`, and Google sign-in is configured in production using Google's verified-email signal.
- Package lesson counts are not settled tutor earnings. Do not display them as currency; a processed refund record is not proof of a real-world refund.

## Technical baseline

- Django REST backend on Railway; Supabase Storage for verification documents; Next.js frontend on Vercel.
- Password reset is implemented.
- F-002 tutor-observed lesson topic check-ins have a dedicated public KVKK
  notice and link from the tutor form. Backend collection remains fail-closed:
  legal approval, a notice version and an explicit pilot/full rollout decision
  are required before the form is exposed.
- F-009 learning plans remain dormant and F-013 Hoca Bul redesign remains
  postponed by current product decision.
- F-006 may display only dormant launch-program metadata. It must not promise a
  free lesson, entitlement or tutor payment until the approved iyzico and
  reconciliation path exists.
- F-003 remains offline research; readiness or model output never changes live
  matching from the frontend.
- Booking lifecycle transitions are centralized in `apps/lessons/services.py::transition_booking`. Tutors cannot directly complete lessons.
- Tutor approval requests that pass their lesson start time are automatically cancelled by the backend; legacy `expired` records are displayed as automatically cancelled.
- Video uses JaaS / 8x8. A confirmed booking has a `room_url`, and users join via `/session/[bookingId]`. Do not implement the obsolete Daily.co plan or `/lesson/[bookingId]`.
- The live lesson JaaS UI keeps the room identity intact while hiding its technical
  conference subject and omitting only the tileview toolbar control. Tutor Whiteboard
  and screen sharing remain enabled.
- Tutors have a private, persistent “Materyaller” workspace per student beneath “Özel Notlarım”; students never query or see these files.
- Messaging polling is intentional; do not add WebSockets without a separate architecture decision.
- Staff users have a guarded `/admin-control` QA center for marked test accounts. Account
  switching uses a short-lived impersonation session with a persistent warning banner;
  test credits are displayed as non-payment QA entitlements and never as purchases/earnings.

## Precedence and maintenance

1. Owner-held product, legal, and policy documents.
2. This document for current direction.
3. `AI_AGENT_RULES.md` for binding repository safeguards.
4. Code and tests for exact behavior.
5. Old roadmaps/handoffs for history only.

Read `AI_AGENT_RULES.md` before any payment, package, credit, refund, booking-lifecycle, or webhook change. Keep this document and `AI_AGENT_RULES.md` current whenever a product constraint changes.
