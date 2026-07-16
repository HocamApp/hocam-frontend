# HOCAM — Current Product & Technical State

**Status date:** 12 July 2026  
This is the active product and technical direction for Hocam. It supersedes earlier roadmaps and M3 handoffs when they conflict; those documents are historical context only.

## Direction

- Hocam is a verified YKS tutor marketplace. Only verified, high-ranking tutors are publicly visible and bookable.
- The sole paid-learning model is a package-credit model: weekly lessons (1–5) × a 14/30/90/180-day duration. One-off paid lessons and ten-lesson packages are retired.
- A package, credit, or ledger record is not proof of a live payment. No payment provider is connected.
- `MANUAL_PAYMENT_ACTIVATION_ENABLED` remains disabled until written founder approval after G0/G1 reconciliation and the payment-provider plan are complete.
- Production email/password registration requires the 6-digit verification code. Resend sends from the verified `hocamozelders.com` domain, password-reset links use `www.hocamozelders.com`, and Google sign-in is configured in production using Google's verified-email signal.
- Package lesson counts are not settled tutor earnings. Do not display them as currency; a processed refund record is not proof of a real-world refund.

## Technical baseline

- Django REST backend on Railway; Supabase Storage for verification documents; Next.js frontend on Vercel.
- Password reset is implemented.
- Booking lifecycle transitions are centralized in `apps/lessons/services.py::transition_booking`. Tutors cannot directly complete lessons.
- Tutor approval requests that pass their lesson start time are automatically cancelled by the backend; legacy `expired` records are displayed as automatically cancelled.
- Video uses JaaS / 8x8. A confirmed booking has a `room_url`, and users join via `/session/[bookingId]`. Do not implement the obsolete Daily.co plan or `/lesson/[bookingId]`.
- Messaging polling is intentional; do not add WebSockets without a separate architecture decision.

## Precedence and maintenance

1. Owner-held product, legal, and policy documents.
2. This document for current direction.
3. `AI_AGENT_RULES.md` for binding repository safeguards.
4. Code and tests for exact behavior.
5. Old roadmaps/handoffs for history only.

Read `AI_AGENT_RULES.md` before any payment, package, credit, refund, booking-lifecycle, or webhook change. Keep this document and `AI_AGENT_RULES.md` current whenever a product constraint changes.
