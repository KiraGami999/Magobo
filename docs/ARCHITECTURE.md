# Magobo — Foundation Architecture

This document records the architectural decisions made in Phase 1 (Foundation). See `AGENTS.md` for the full engineering rules and product brief.

## Monorepo Structure

```
Magobo/
├── apps/
│   ├── web/                 Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui
│   └── mobile/               Expo (SDK 57), Expo Router, TypeScript
├── packages/
│   ├── db/                   Prisma schema, generated client, singleton client export
│   └── shared/                Cross-platform types, zod schemas, API response envelope
├── docs/
│   └── ARCHITECTURE.md
├── AGENTS.md                 Persistent agent/engineering operating rules
├── package.json               npm workspaces root
└── tsconfig.base.json         Shared strict TypeScript compiler options
```

### Why npm workspaces (not pnpm/turbo) for now

Node's built-in package manager was already present and sufficient for a two-app, two-package monorepo. Turborepo/pnpm can be introduced later if build-graph caching becomes a real bottleneck — per the dependency rule ("don't add a package just because it makes one thing easier"), we're starting with the minimum that works.

## Web (`apps/web`)

- **Framework**: Next.js 16, App Router, `src/` directory, TypeScript strict mode.
- **Styling**: Tailwind CSS v4 (CSS-first `@theme` config in `globals.css`), shadcn/ui components in `src/components/ui`.
- **Design system tokens**: primary (trust blue), success, warning, info, destructive — defined as OKLCH CSS variables in `globals.css`, mirrored as hex tokens in the mobile app's `src/theme/colors.ts` so both platforms visually agree.
- **Magobo-specific components** (`src/components/magobo`): `StatusBadge`, `VerificationBadge`, `EmptyState`, `ErrorState`, `LoadingState` — the reusable building blocks every future feature should compose rather than reinvent.
- **Backend architecture** (`src/server`):
  - `errors.ts` — `AppError` hierarchy (`ValidationError`, `UnauthenticatedError`, `UnauthorizedError`, `NotFoundError`, `ConflictError`, `RateLimitedError`), each carrying a stable `ErrorCode` and HTTP status.
  - `api-response.ts` — `ok()` / `fail()` helpers producing the standard `{ success, data|error }` envelope, plus `withErrorHandling()`, a route-handler wrapper that centralizes try/catch, translates `AppError`/`ZodError` into proper responses, and guarantees unexpected exceptions never leak internals to the client.
  - `validate.ts` — `parseOrThrow(schema, input)`, a one-line zod validation helper used at every API boundary.
  - This gives every future route the same shape: `Controller (route.ts) → validate() → service → prisma → ok()/fail()`.
- **Example route**: `GET /api/health` — verifies the process is up *and* that Prisma can reach PostgreSQL (`SELECT 1`), unauthenticated by design (deployment health checks).

## Mobile (`apps/mobile`)

- **Framework**: Expo SDK 57, Expo Router (file-based routing, mirroring the web's App Router), TypeScript strict mode.
- **Structure**: `app/` for routes (`_layout.tsx`, `index.tsx`), `src/theme` and `src/components` for shared UI building blocks (e.g. `StatusBadge`), matching the web app's component naming so the two platforms stay conceptually aligned without sharing React code directly (React Native and React DOM components aren't interchangeable, but the *shape* of the design system is).
- ESLint configured via `eslint-config-expo`.

## Shared Packages

### `@magobo/shared`

Framework-agnostic TypeScript consumed by both `web` and `mobile`:

- `types/api.ts` — `ApiResponse<T>`, `ApiSuccess<T>`, `ApiFailure`, `ErrorCode`, `PaginatedResult<T>`. This is the contract every API response conforms to, so a mobile client and a web client parse responses identically.
- `schemas/common.ts` — reusable zod primitives: `emailSchema`, `phoneSchema`, `passwordSchema`, `uuidSchema`, `paginationSchema`. Domain schemas (auth, gigs, ...) added in later phases compose these instead of redefining validation rules per feature.

### `@magobo/db`

- `prisma/schema.prisma` — currently has **zero domain models** by design. Phase 1 is infrastructure only; `User`, `Session`, and other entities are added in Phase 2+ with their own migration, reviewed for indexes/constraints before being written.
- `src/index.ts` — exports a singleton `PrismaClient` (`prisma`), cached on `globalThis` in development to survive Next.js hot-reload without exhausting the connection pool.
- Uses `DATABASE_URL` (pooled/PgBouncer connection, used at runtime) and `DIRECT_URL` (unpooled, used only for migrations) — the standard pattern for serverless-friendly Postgres providers like Neon.

## Database

- **Provider**: Neon (serverless PostgreSQL), provisioned via the Neon MCP tool for this workspace. Project: `magobo` (`plain-water-75796614`), database `magobo`, branch `main`.
- Verified end-to-end: `prisma generate` → `prisma migrate dev --name init` connected successfully via `DIRECT_URL` ("Already in sync, no schema change or pending migration was found" — expected, since there are no models yet).
- Real credentials live only in `packages/db/.env` (git-ignored); `packages/db/.env.example` documents the required shape without secrets.

## Environment Configuration

- `packages/db/.env` / `.env.example` — `DATABASE_URL`, `DIRECT_URL`.
- Future phases will add `apps/web/.env.local` for web-only secrets (auth session secret, provider API keys) and `apps/mobile/.env` / `app.config.ts` extras for mobile-specific public config — none of these are committed.

## Verification Performed for Phase 1

- [x] `npm run typecheck` — passes across all workspaces.
- [x] `npm run lint` — passes across all workspaces.
- [x] Web app builds/runs (`npm run dev:web`); `/` renders the design-system preview, `/api/health` returns `{ success: true, data: { status: "ok", database: "connected" } }`.
- [x] Mobile app starts under Expo (`npm run dev:mobile`) and type-checks.
- [x] Prisma successfully connects to the live Neon PostgreSQL database.

## Explicitly Deferred

- **Payments/escrow** — paused by explicit instruction until the payment model is finalized. Every later module (proposals, projects, milestones) is built with a clean seam for a future payment service, but no real payment logic exists yet.

---

# Phase 2 — Authentication

## Database Models (`packages/db/prisma/schema.prisma`)

- **`User`** — one identity system for the whole platform. `roles: UserRole[]` (`INDIVIDUAL`, `BUSINESS`, `SERVICE_PROVIDER`, `ADMIN`) lets a single account act as client and provider simultaneously — Magobo never splits these into separate identity tables. `email`/`phone` are both optional but at least one is required by the `registerSchema` refinement; either can be the login identifier. `passwordHash` is never selected into API responses (see serializer below). `failedLoginAttempts`/`lockedUntil` implement account-level brute-force lockout, independent of the IP-based rate limiter.
- **`Session`** — database-backed sessions, not stateless JWTs. Only `tokenHash` (SHA-256 of the raw token) is persisted; the raw token is only ever held by the client. This makes sessions individually revocable server-side (logout, password reset invalidates all sessions) — something a bare JWT can't do without an extra denylist table anyway.
- **`VerificationToken`** — unifies email verification links, phone OTP codes, and password-reset codes under one table (`purpose` + `channel` enums), each with `attempts` (capped, to prevent OTP brute-forcing) and `expiresAt`.

## Session Strategy: cookie for web, bearer token for mobile — same backend

- **Web** (`apps/web/src/server/auth/session.ts`, `issue-session.ts`): the raw session token is set as an `httpOnly`, `sameSite=lax` cookie (`magobo_session`) and *never* appears in a JSON response body for a normal browser request. This is what makes it resistant to theft via XSS — injected page JavaScript can't read an httpOnly cookie.
- **Mobile**: React Native has no equivalent of httpOnly cookies, so the mobile client sends `X-Client-Platform: mobile` on every request; the backend then returns the raw session token in the response body instead of setting a cookie. The Expo app stores it via `expo-secure-store` (OS Keychain/Keystore — not `AsyncStorage`) and sends it back as `Authorization: Bearer <token>`.
- `getSessionFromRequest()` checks the `Authorization` header first, then falls back to the cookie — one lookup path serves both clients identically. Sessions use sliding expiration (`lastUsedAt` touched on each successful lookup) with a 30-day absolute TTL.

## Password & Token Handling (`apps/web/src/server/auth/`)

- **Passwords**: `bcryptjs` (pure JS — avoids native-module build issues in this environment), 12 salt rounds.
- **Tokens**: `crypto.randomBytes(32)` for opaque link tokens (base64url), `crypto.randomInt` for 6-digit numeric OTPs (SMS). Both are hashed with SHA-256 before storage — the database never holds anything usable to impersonate a session or replay a verification code.
- **Rate limiting** (`apps/web/src/server/rate-limit.ts`): a `RateLimiter` interface with an in-memory fixed-window implementation, explicitly documented as **dev-only** (doesn't survive restarts or scale across instances). Swap the implementation for Redis (or similar) before running more than one server process — nothing else in the codebase depends on the concrete implementation. Applied per-IP to register/login/forgot-password/reset-password/verify-email, and per-user to phone OTP request/verify.
- **Mock providers** (`apps/web/src/server/providers/`): `EmailProvider` and `SmsProvider` interfaces, each with a console-logging mock implementation. No real ESP/SMS vendor is wired up yet; swapping in one later (SES, Postmark, Twilio, ...) means implementing the interface, not touching call sites. Phase 11 (Notifications) will build on top of these same interfaces rather than replacing them.

## Auth Service Layer (`apps/web/src/server/services/auth.service.ts`, `verification.service.ts`)

- `registerUser`, `loginUser`, `logoutUser`, `verifyEmailToken`, `verifyPhoneOtp`, `requestPhoneOtp`, `requestPasswordReset`, `resetPassword` — all business logic lives here, not in route handlers. Session issuance is deliberately *not* done inside the service (that's a transport concern for the route layer via `issueSession()`), keeping the service testable and platform-agnostic.
- **No user enumeration**: login failure returns the same generic message whether the account doesn't exist or the password is wrong; `forgot-password` always returns the same success message regardless of whether the email is registered.
- **Account lockout**: 5 failed attempts locks the account for 15 minutes, independent of the IP rate limiter (defense in depth — an attacker rotating IPs still can't brute-force one account).
- **Password reset revokes every session** for that user — a stolen session dies the moment the legitimate owner resets their password.
- `toPublicUser()` (`apps/web/src/server/serializers/user.ts`) is the *only* place a `User` record is shaped for API responses — the one deliberate chokepoint that prevents `passwordHash`/`failedLoginAttempts`/etc. from ever leaking.

## API Routes (`apps/web/src/app/api/auth/`)

`register`, `login`, `logout`, `me`, `forgot-password`, `reset-password`, `verify-email`, `phone/request-otp`, `phone/verify-otp` — every route follows the same `validate → service → issueSession/serialize → ok()` shape established in Phase 1, wrapped in `withErrorHandling()`. Phone OTP endpoints require an authenticated session (verifying a phone is something you do for *your own* account — a public "send OTP to any number" endpoint would just be an SMS-bombing vector).

## Web UI (`apps/web/src/app/(auth)/`)

Route group (no `/auth` URL prefix) with a shared centered-card layout: `register`, `login`, `forgot-password`, `reset-password`. Client-side validation reuses the exact same zod schemas as the backend (`@magobo/shared`) before hitting the network. `SiteHeader` (`src/components/magobo/site-header.tsx`) reflects live session state via `useCurrentUser()` (`GET /api/auth/me`).

## Mobile UI (`apps/mobile/app/(auth)/`, `src/lib/`)

Mirrors the web flow screen-for-screen. `AuthProvider`/`useAuth()` (`src/lib/auth-context.tsx`) wraps the app in `_layout.tsx`, exposing `user`, `login`, `register`, `logout`. `session-store.ts` wraps `expo-secure-store`. `metro.config.js` was added to explicitly watch the monorepo root and resolve `node_modules` from both the app and workspace root — required for Metro to bundle the `@magobo/shared` workspace package.

## Testing (`apps/web/src/server/**/*.test.ts`, run via `npm test`)

Vitest, scoped deliberately to **pure business logic that doesn't require a live database**: password hashing round-trips, token generation/hashing properties, the in-memory rate limiter's window/reset behavior, `requireRole`/`requireOwnership` authorization logic, and the shared zod auth schemas' accept/reject boundaries. 27 tests, all passing.

Full end-to-end flows (register → verify email → login → wrong-password lockout → forgot/reset password → session revocation → mobile bearer-token path) were manually verified against the live Neon database this phase via direct API calls — documented here rather than automated, since a proper integration suite deserves its own seeded test database/CI setup rather than hitting the shared dev database. That's a good candidate for a later phase once CI exists.

## Explicitly Deferred (Phase 2)

- **All remaining domain database models** (`Gig`, `Proposal`, ...) — added incrementally in later phases, not created up front.

---

# Phase 3 — Profiles & KYC

## Database Models

- **`ServiceCategory`** — hierarchical taxonomy (parent/child) stored in PostgreSQL, seeded via `packages/db/prisma/seed.ts`. Reused by profiles now and by the gig marketplace in Phase 4 — never hard-coded in UI.
- **`UserProfile`** — individual/service-provider profile (bio, location, skills, availability, photo storage key, trust placeholders). One per user.
- **`BusinessProfile`** — business name, description, logo storage key, location, trust placeholders. One per user with a `BUSINESS` role.
- **`UserProfileCategory` / `BusinessProfileCategory`** — many-to-many joins between profiles and categories.
- **`KycCase`** — one case per user; `status` follows the platform state machine (`NOT_STARTED → PENDING → UNDER_REVIEW → VERIFIED | REJECTED`, plus `EXPIRED`). All transitions enforced in `kyc.service.ts`, never via direct client writes.
- **`KycDocument`** — metadata + `storageKey` only. Raw identity bytes live in object storage (mock: `.storage/` on disk), never in PostgreSQL.

## Storage & KYC Provider Abstractions

- **`StorageProvider`** (`apps/web/src/server/providers/storage.ts`) — `store`, `getSignedReadUrl`, `delete`. Mock writes to `apps/web/.storage/` (git-ignored). Profile photos and KYC documents both use this interface.
- **`KycProvider`** (`apps/web/src/server/providers/kyc.ts`) — logs submission events. No real verification vendor integrated; admin review is the source of truth until one is wired up.

## Profile Service (`profile.service.ts`)

- `getOwnProfile`, `getPublicProfile`, `updateUserProfile`, `updateBusinessProfile`, `uploadUserProfilePhoto`, `enableProviderRole`, `listCategories`.
- Trust stats (`averageRating`, `reviewCount`, `completedGigsCount`) are **read-only placeholders** — never accepted from client input; Phase 9 will populate them.
- `enableProviderRole` adds `SERVICE_PROVIDER` or `BUSINESS` to the user's role array and creates the corresponding profile shell + KYC case.

## KYC Service (`kyc.service.ts`)

- `uploadKycDocument`, `submitKyc`, `listAdminKycQueue`, `getAdminKycCase`, `approveKycCase`, `rejectKycCase`.
- Required documents depend on roles: all users need ID front/back + selfie; `BUSINESS` role additionally requires business registration.
- Submitting moves `NOT_STARTED`/`REJECTED` → `PENDING`; admin opening a case auto-transitions `PENDING` → `UNDER_REVIEW`.
- Admin approve/reject requires `ADMIN` role via `requireRole`.

## API Routes

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/categories` | Public | Category tree |
| `GET/PATCH /api/profile/me` | User | Own profile read/update |
| `POST /api/profile/me/roles` | User | Enable provider/business capability |
| `POST /api/profile/me/photo` | User | Upload profile photo |
| `PATCH /api/profile/business` | User | Update business profile |
| `GET /api/profile/[userId]` | Public | Public profile view |
| `GET /api/profile/photo/[userId]` | Public | Serve profile photo (no storage key exposed) |
| `GET /api/kyc/me` | User | Own KYC status (no document bytes/keys) |
| `POST /api/kyc/documents` | User | Upload KYC document |
| `POST /api/kyc/submit` | User | Submit for review |
| `GET /api/admin/kyc` | Admin | Review queue |
| `GET /api/admin/kyc/[id]` | Admin | Case detail with signed review URLs |
| `POST /api/admin/kyc/[id]/approve` | Admin | Approve |
| `POST /api/admin/kyc/[id]/reject` | Admin | Reject with reason |
| `GET /api/admin/storage/[...key]` | Admin | Serve KYC document for review |

## Web & Mobile UI

- Web: `/profile`, `/profile/kyc`, `/admin/kyc`, `/admin/kyc/[id]`. Header links to Profile (and Admin for `ADMIN` users).
- Mobile: `app/profile/index.tsx`, `app/profile/kyc.tsx` — KYC document upload on mobile is documented as a follow-up (`expo-document-picker`); submit/status viewing works today.

## Testing

34 unit tests (added profile/KYC schema + `requiredDocumentsForUser` tests). Typecheck and lint pass across all workspaces.

## Explicitly Deferred (Phase 3)

- Real object-storage provider (S3/R2) and real KYC vendor (Onfido, etc.).
- Mobile KYC document picker integration.
- Full audit-log table for admin actions (Phase 10).

---

# Phase 4 — Gig Marketplace

## Database Models

- **`Gig`** — posted by a user (`ownerUserId`). Includes title, description, category, budget (integer minor units), location, deadline, `status`, `publishedAt`, soft-delete via `deletedAt`.
- **`GigAttachment`** — brief attachments with storage keys only (same pattern as KYC documents).
- **`GigStatus` enum** — full lifecycle defined upfront; Phase 4 implements transitions for `DRAFT`, `RECEIVING_PROPOSALS`, and `CANCELLED` only. Later phases add proposal/negotiation/project transitions.

## Gig Service (`gig.service.ts`)

Centralized state machine — clients never set `status` directly:

| From | To | Action |
|---|---|---|
| `DRAFT` | `RECEIVING_PROPOSALS` | Publish (sets `publishedAt`) |
| `DRAFT` | `CANCELLED` | Cancel |
| `RECEIVING_PROPOSALS` | `CANCELLED` | Cancel |

- Draft gigs are editable; published gigs are not.
- Attachments can only be added/removed on drafts.
- Discovery lists only `RECEIVING_PROPOSALS` gigs (not deleted).
- Owners/admins can view drafts; everyone else gets 404 for non-public gigs.
- Posting requires `ACTIVE` account status.

## API Routes

`GET/POST /api/gigs`, `GET /api/gigs/mine`, `GET/PATCH /api/gigs/[id]`, `POST .../publish`, `POST .../cancel`, `POST .../attachments`, `GET/DELETE .../attachments/[attachmentId]`.

Discovery supports search (`q`), category, city, country, budget range, and pagination.

## Web & Mobile UI

- Web: `/gigs` (browse + filters), `/gigs/new`, `/gigs/[id]`, `/gigs/[id]/edit`, `/my/gigs`. Homepage and header link to gig flows.
- Mobile: browse + detail screens; gig creation form deferred to web for now.

## Testing

39 unit tests (added gig schema + transition map tests). Typecheck and lint pass across all workspaces.

## Explicitly Deferred

- Mobile gig creation form.
- Geo-radius search (lat/lng indexed but not queried yet).

---

# Phase 5 — Proposals & Negotiation

## Database Models

- **`Proposal`** — provider submission on a gig. One proposal per provider per gig (`@@unique([gigId, providerUserId])`). Budget in integer minor units.
- **`ProposalNegotiationEntry`** — on-platform counter-offers and messages.
- **`ProposalStatus` enum** — `SUBMITTED`, `SHORTLISTED`, `NEGOTIATING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`.
- **`Gig.awardedProposalId`** — set when a proposal is accepted; gig moves to `AWARDED`.

## Proposal Service (`proposal.service.ts`)

Centralized proposal + gig state machine:

| Proposal action | Status change | Gig effect |
|---|---|---|
| Submit | → `SUBMITTED` | — |
| Shortlist (owner) | `SUBMITTED` → `SHORTLISTED` | — |
| Counter-offer | → `NEGOTIATING` | `RECEIVING_PROPOSALS` → `NEGOTIATING` on first negotiation |
| Accept (owner) | → `ACCEPTED`; others → `REJECTED` | → `AWARDED`, sets `awardedProposalId` |
| Reject (owner) | → `REJECTED` | — |
| Withdraw (provider) | → `WITHDRAWN` | — |

- Submit requires `SERVICE_PROVIDER` role and `ACTIVE` account; cannot propose on own gig.
- Authorization: gig owner manages proposals; provider manages own proposal; admin override where applicable.
- **`notificationProvider`** (mock console logger) fires on key events — seam for Phase 11.

## API Routes

`POST/GET /api/gigs/[id]/proposals` (submit / list; `?mine=true` for provider's own), `GET /api/proposals/mine`, `GET /api/proposals/[id]`, `POST .../shortlist`, `.../reject`, `.../accept`, `.../withdraw`, `.../negotiate`.

## Web & Mobile UI

- Web: proposal submit on `/gigs/[id]`, owner proposal panel, `/my/proposals`, `/proposals/[id]` negotiation view. Header links to Proposals for providers.
- Mobile: `/proposals` list + detail; gig detail links to existing proposal (submission deferred to web).

## Testing

46 unit tests (added proposal schema + transition map tests). Typecheck and lint pass across all workspaces.

## Explicitly Deferred (Phase 5)

- Mobile proposal submission form.
- Real notification delivery (Phase 11).

---

# Phase 6 — Messaging

## Database Models

- **`Conversation`** — one thread per proposal between gig owner and provider.
- **`Message`** — on-platform text with server-side moderation metadata (`CLEAN` / `FLAGGED`, `moderationFlags[]`).
- **`MessageAttachment`** — storage references only (images/PDF, max 5 MB).

Conversations are created automatically when a provider submits a proposal. Older proposals without a thread get one lazily on first access.

## Message Service (`message.service.ts`)

- Participants only (owner + provider; admin override for review).
- Send allowed while proposal status is `SUBMITTED`, `SHORTLISTED`, `NEGOTIATING`, or `ACCEPTED`; rejected/withdrawn threads are read-only.
- **`moderation.service.ts`** scans for phone numbers, emails, external payment hints, and off-platform contact apps — flags messages but still delivers them (anti-disintermediation without aggressive blocking).
- Mock **`MESSAGE_RECEIVED`** notification on send.

## API Routes

`GET /api/conversations`, `GET /api/conversations/[id]`, `POST /api/conversations/[id]/messages`, `GET /api/conversations/[id]/attachments/[attachmentId]`, `GET /api/proposals/[id]/conversation`.

## Web & Mobile UI

- Web: `/messages` inbox, `/messages/[id]` thread view, “Open messages” on proposal detail, header Messages link.
- Mobile: `/messages` list + thread with send composer.

## Testing

54 unit tests (added message schema + moderation scan tests). Typecheck and lint pass across all workspaces.

## Explicitly Deferred (Phase 6)

- Read receipts / unread counts.
- Real-time delivery (WebSockets/push — Phase 11).
- AI moderation beyond regex flags.

---

# Phase 7 — Project Workflow

## Database Models

- **`GigMilestone`** — optional work breakdown set by the gig owner (integer minor amount seam for future payments).
- **`GigDeliverable`** — versioned provider submissions (`submissionNumber`, `PENDING_REVIEW` / `ACCEPTED` / `SUPERSEDED`).
- **`GigDeliverableAttachment`** — deliverable files (storage references only).
- **`GigRevisionRequest`** — owner feedback when requesting changes.
- **`Gig.startedAt` / `Gig.completedAt`** — project timestamps.

## Project Service (`project.service.ts`)

Centralized gig + milestone state machine (Phase 7 transitions only — no payment logic):

| Action | Gig transition | Who |
|---|---|---|
| Start project | `AWARDED` → `IN_PROGRESS` | Owner or provider |
| Submit deliverable | `IN_PROGRESS` → `SUBMITTED` or `REVISION_REQUESTED` → `RESUBMITTED` | Awarded provider |
| Request revision | `SUBMITTED`/`RESUBMITTED` → `REVISION_REQUESTED` | Owner |
| Accept deliverable | → `COMPLETED` | Owner |
| Add milestone | — | Owner |
| Submit milestone | `PENDING`/`REJECTED` → `SUBMITTED` | Provider |
| Approve/reject milestone | `SUBMITTED` → `APPROVED`/`REJECTED` | Owner |

- Only project participants (owner + awarded provider) can access project data.
- Awarded providers can now view their awarded gigs via `getGig`.
- Mock notifications on start, milestone events, deliverable submit, revision request, and completion.

## API Routes

`GET /api/projects/mine`, `GET /api/gigs/[id]/project`, `POST .../project/start`, `.../submit`, `.../request-revision`, `.../accept`, `POST /api/gigs/[id]/milestones`, milestone approve/reject/submit, deliverable attachment download.

## Web & Mobile UI

- Web: `/projects` list, `/projects/[id]` workspace (milestones, deliverables, revisions). Gig cards link to projects when in project phase. Header Projects link.
- Mobile: project list + summary detail (full actions deferred to web, same pattern as proposal submission).

## Testing

59 unit tests (added project schema + transition map tests). Typecheck and lint pass across all workspaces.

## Explicitly Deferred (Phase 7)

- Mobile full project workspace (submit deliverable, revisions).
- Milestone-based payment release (full Phase 8 — deferred).
- Platform monetization model TBD.

---

# Phase 8 — Payments (Seam Only)

**Full escrow/ledger integration remains deferred** until the monetization model is finalized. For now:

- **`GET /api/payments/options`** — returns PayChangu portal URL, supported methods, and disclaimer.
- **`PAYCHANGU_PORTAL_URL`** env var (default `https://dashboard.paychangu.com`) — merchants create/share payment links in PayChangu.
- **Web UI:** `PaymentOptionsPanel` on project workspace — PayChangu link, plus cash and direct bank transfer as off-platform options.
- Magobo does **not** process payments, hold funds, or take fees yet. Work tracking, messaging, and reviews stay on-platform.

When monetization is decided, slot in provider-agnostic `Payment`/`Escrow` services without changing the project/review flows.

---

# Phase 9 — Trust System (Reviews & Ratings)

## Database Models

- **`GigReview`** — one review per participant per completed gig (`@@unique([gigId, reviewerUserId])`). Rating 1–5 + optional comment.

## Review Service (`review.service.ts`)

- Reviews allowed when gig is `COMPLETED` or `REVIEWED`.
- Owner reviews provider; provider reviews owner.
- **`recalculateTrustStats`** updates `UserProfile` / `BusinessProfile`: `averageRating`, `reviewCount`, `completedGigsCount`.
- When both parties have reviewed, gig → `REVIEWED`.
- Completed gig counts updated when owner accepts deliverable.

## API Routes

`POST/GET /api/gigs/[id]/reviews`, `GET ...?pending=true`, `GET /api/users/[userId]/reviews`, `GET /api/payments/options`.

## Web UI

- Review form on project page after completion.
- Public profile at `/users/[userId]` with trust stats and reviews.

## Testing

Unit tests for review schema and payment seam constants. Typecheck and lint pass across all workspaces.
