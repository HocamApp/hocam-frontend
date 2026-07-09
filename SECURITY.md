# Security Policy

This repository contains the Hocam frontend. The frontend is a user interface,
not a security boundary. Auth, authorization, payments, bookings, file access,
AI permissions, and private data decisions must be enforced by the backend.

## Supported Branch

Security fixes are applied to `main`.

## Reporting a Vulnerability

Do not open a public issue for a suspected vulnerability.

Report privately to the project owner with:

- Affected repo and commit.
- Page, route, component, or API call involved.
- Steps to reproduce.
- Expected vs actual result.
- Any evidence, with secrets and private user data redacted.

Do not include real passwords, tokens, API keys, private documents, signed URLs,
or private message contents in reports.

## Frontend Security Rules

- Never place backend secrets in frontend code or `NEXT_PUBLIC_*` variables.
- Never decide role, premium/payment status, ownership, or admin access in the
  frontend.
- Never rely on hidden buttons as authorization.
- Render user and AI content as escaped text unless a sanitizer and threat model
  are explicitly added.
- Do not log tokens, private user data, signed URLs, or secrets.
- Keep production security headers and HTTPS behavior intact.
- Treat API errors as untrusted; do not expose stack traces or internal details
  to users.

## Release Gate

A frontend release is blocked by any confirmed:

- Secret exposure in source, public env vars, build output, or logs.
- Unsafe HTML rendering of user or AI content.
- Client-side-only admin, payment, premium, booking, or ownership decision.
- Public route exposing private user data.
- Production config that weakens security headers or exposes internals.

For the full project security checklist and operational runbook, see the backend
repository's `docs/security.md`.
