# AGENTS.md — Magobo

This file is the persistent operating standard for any AI agent (or human) working on Magobo. It consolidates the master project brief, engineering rules, and specialist skills that govern how this codebase is built. Read this before making changes.

## What Magobo Is

Magobo is a production-grade, multi-directional local gig marketplace connecting individuals, freelancers, skilled workers, students, professionals, and local businesses. It supports C2C, B2C, B2B, individual↔provider, and business↔provider relationships. Users post gigs, discover gigs, submit proposals, negotiate, communicate, complete work, request revisions, and get paid — **entirely on-platform**.

Core objective: make finding, hiring, managing, communicating with, and paying local service providers **safe, transparent, and on-platform**.

## Tech Stack

- **Web**: Next.js, TypeScript, React, Tailwind CSS, shadcn/ui.
- **Mobile**: React Native, Expo, TypeScript, Expo Router.
- **Backend**: Next.js API routes, TypeScript, REST, service-layer architecture.
- **Database**: PostgreSQL via Prisma ORM (the only normal application-level DB access path).
- **Auth**: unified identity (email/phone/password/OTP), session/token management, RBAC.
- **Infra**: KYC, payments, storage, push, email, SMS, and maps are all abstracted behind service interfaces — never tightly coupled to one provider.

## Monorepo Layout

```
apps/
  web/        Next.js app (App Router)
  mobile/     Expo app (Expo Router)
packages/
  db/         Prisma schema + generated client + singleton
  shared/     Cross-platform types, zod schemas, API response envelope
docs/
  ARCHITECTURE.md
```

Workspaces are npm workspaces (`apps/*`, `packages/*`). Root scripts delegate to per-workspace scripts (`npm run dev:web`, `npm run dev:mobile`, `npm run lint`, `npm run typecheck`, `npm run db:generate`, etc.).

## Core User Types

A single account may act as **INDIVIDUAL**, **BUSINESS**, **SERVICE PROVIDER**, and/or **ADMIN**. There is **one identity system** with permissions/capabilities — never separate auth systems for clients vs. providers.

## Core Platform Modules

Auth, User Profiles, Business Profiles, KYC, Gig Categories, Gig Posting, Discovery, Search, Filtering, Proposals, Offers, Negotiation, Messaging, Attachments, Project Management, Milestones, Revisions, Contracts, Payments, Escrow, Reviews, Ratings, Notifications, Disputes, Reports, Admin Dashboard, Fraud/Risk monitoring, Audit logs, Analytics.

## Gig Lifecycle (state machine)

```
DRAFT → PUBLISHED → RECEIVING_PROPOSALS → NEGOTIATING → AWARDED → IN_PROGRESS
→ SUBMITTED → REVISION_REQUESTED → RESUBMITTED → COMPLETED → PAYMENT_RELEASED → REVIEWED
```

Plus: `CANCELLED`, `DISPUTED`, `SUSPENDED`. **Never allow arbitrary status changes** — all transitions go through centralized backend business logic (services), never through direct field writes or frontend-driven state.

## Anti-Disintermediation

Keep communication, negotiation, revisions, agreements, deliverables, and payments **on-platform**. Use moderation/risk-scoring architecture (extensible with AI later) to flag obvious off-platform attempts (phone numbers, personal emails, external payment instructions, suspicious links) — never rely on client-side validation alone, and never block normal conversation aggressively.

## KYC

States: `NOT_STARTED → PENDING → UNDER_REVIEW → VERIFIED | REJECTED`, plus `EXPIRED`. Never store raw identity documents in PostgreSQL — store secure object-storage references only. Minimize exposure of sensitive KYC data through APIs. Use a mock KYC provider abstraction until a real provider is integrated — never claim real verification is happening when it isn't.

## Payments (deferred until the model is finalized)

**Payments/escrow implementation is currently paused by explicit user instruction** — build every other module with a clean seam for payments to slot in later, but do not implement real payment/escrow logic until told to resume. When resumed: use an immutable transaction ledger (never mutate a balance directly), integer minor currency units (never floats), and provider-agnostic abstractions (Payment, Transaction, Escrow, Payout, Refund).

## Database Rules

- Prisma + PostgreSQL; Prisma is the only normal DB access layer (no raw SQL unless Prisma genuinely cannot do it).
- UUID identifiers, `createdAt`/`updatedAt`, soft deletion where appropriate, indexes based on real query patterns, unique constraints, enums for controlled states.
- Money is always integer minor units — never floating point.
- Financial and multi-record operations use transactions and must be atomic.
- Build the schema **incrementally** — do not create all tables up front. Inspect existing models, understand relationships and migration impact, and never casually rename/delete fields. Explain destructive migrations before running them.

## Security & Authorization

- Every protected endpoint: authenticate → authorize → validate → execute → respond consistently.
- Authentication answers "who are you"; authorization answers "are you allowed to do this" — always do both.
- Resource ownership is verified **server-side**. Never trust a frontend-supplied ID or state (payment state, verification state, ownership, permissions, gig status) — the server is the source of truth.
- Never expose passwords, tokens, private KYC data/documents, payment secrets, or env vars — not in responses, logs, Git, or client bundles.

## API Conventions

Success:

```json
{ "success": true, "data": {}, "message": "Operation successful" }
```

Error:

```json
{ "success": false, "error": { "code": "RESOURCE_NOT_FOUND", "message": "Gig not found" } }
```

Never leak raw database/internal exceptions to clients. Backend flow: **Controller/API → Validation → Service → Repository (Prisma) → Database**. Business rules live in services, not in route handlers or UI components.

## Responsive & Accessibility

Mobile-first, fully responsive web (no desktop-only experiences). Every page must remain usable at 320/375/390/430/768/1024/1440px+ with no horizontal overflow, no tiny touch targets, and mobile-friendly alternatives to dense desktop tables. Semantic HTML, accessible labels, keyboard navigation, and never color-only status signaling.

## Design System

Magobo should feel modern, trustworthy, local, professional, fast, friendly, premium. Trust is communicated visually via verified badges, ratings, reviews, completed-gig counts, response rates, clear pricing, and status. Avoid visual noise/excessive animation. Reusable components live in `apps/web/src/components/ui` (shadcn primitives) and `apps/web/src/components/magobo` (Magobo-specific: `StatusBadge`, `VerificationBadge`, `EmptyState`, `ErrorState`, `LoadingState`, ...). Extend this set rather than duplicating near-identical components.

## Code Quality

TypeScript strict mode everywhere. No `any` without an unavoidable, documented external-library boundary. Small, well-named, single-purpose functions/services. No magic numbers, no hard-coded categories/values that belong in the database. Feature/domain folder organization over generic dumping grounds.

## Development Process (non-negotiable)

Build **incrementally**, one phase/feature at a time:

1. Inspect existing architecture/models before changing anything.
2. Identify dependencies and implications (data, security, financial, notifications).
3. Plan → implement → test → fix → refactor → document.
4. Never destroy working functionality to add a new one.
5. When a feature spans layers, update all of them together: database → backend → validation → API → web → mobile → tests → docs.
6. Keep the app runnable after every stage.

Never build fake functionality. If an external integration (payments, KYC, SMS, email, push) doesn't exist yet, create a clean service interface plus a mock/dev implementation — and be explicit that it's mocked.

## Testing & "Done" Checklist

A feature is not complete because the happy-path UI works. Before considering it done, confirm:

- TypeScript passes, lint passes, relevant tests pass.
- Database changes are migrated (and migration impact was considered).
- API authorization actually works (test as an unauthorized/other user, not just the happy path).
- Mobile behavior and web responsiveness were both considered.
- Loading, empty, error, and success states all exist.

Prioritize tests for: authentication, authorization, gig state transitions, proposal acceptance/negotiation, payments (once resumed), reviews, KYC status transitions, disputes, permissions.

## Specialist Skills (apply the relevant one per task)

- **Marketplace Architect** — before implementing marketplace functionality: identify actors, permissions, lifecycle, state transitions, financial implications, security implications, notifications, and DB relationships. Prefer explicit state machines over loose status fields; keep rules in backend services.
- **Prisma Database Engineer** — normalized models, UUIDs, query-driven indexes, enums, transactions for multi-record/financial writes. Inspect before modifying; never casually rename/delete fields; explain destructive migrations first.
- **Next.js Backend Engineer** — service-layer architecture (Controller → Validation → Service → Repository/Prisma → DB); avoid giant route handlers; server controls payment/verification/ownership/permission/status state, never the client.
- **React Native / Expo Engineer** — mobile is a client of the backend, never a place to re-implement business logic. Handle loading/empty/error/offline/success states. Platform-specific code only when necessary, and isolated when used.
- **Next.js Web Engineer** — mobile-first, fully responsive, accessible, reusable components; every complex desktop component needs a mobile strategy.
- **Magobo Security Engineer** — for every feature, ask: can another user manipulate this, access others' data, lie via the frontend, replay/duplicate the request, or cause financial loss? Fix at the backend.
- **Magobo UX/UI Designer** — communicate trust (verification, ratings, reviews, clear pricing/status); clear hierarchy; sparing animation; mobile-first; the user should always know where they are, what's happening, what's next, and whether their money/work is protected.

## Current Build Status

Building in explicit phases, verified before moving on:

1. **Foundation** — monorepo, tooling, DB connectivity, design system foundation. *(in progress)*
2. Authentication
3. Profiles & KYC
4. Gig marketplace
5. Proposals & negotiation
6. Messaging
7. Project workflow (milestones/revisions)
8. **Payments — paused, resume only when explicitly requested**
9. Trust system (reviews/ratings)
10. Admin platform
11. Notifications
12. UX/responsiveness audit

Do not skip ahead to a later phase before the current one is implemented and verified (typecheck, lint, runs, and — where relevant — authorization tested from an attacker's perspective).
