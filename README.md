# Magobo

A production-grade, multi-directional local gig marketplace — connecting individuals, freelancers, skilled workers, and businesses to post gigs, hire, negotiate, communicate, and get paid, entirely on-platform.

See [`AGENTS.md`](./AGENTS.md) for the full engineering rules and product brief, and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for architecture decisions.

## Structure

```
apps/
  web/        Next.js web app
  mobile/     Expo React Native app
packages/
  db/          Prisma schema + client (PostgreSQL)
  shared/      Shared types, validation schemas, API response contract
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- A PostgreSQL database (e.g. [Neon](https://neon.tech))

### Setup

```bash
npm install

# Configure the database
cp packages/db/.env.example packages/db/.env
# edit packages/db/.env with your DATABASE_URL / DIRECT_URL

# apps/web reads env vars from its own root — mirror the same values here
cp apps/web/.env.example apps/web/.env.local

# apps/mobile needs to know where the API is (defaults to localhost)
cp apps/mobile/.env.example apps/mobile/.env

npm run db:generate
npm run db:migrate
npm run db:seed    # service categories for profiles/gigs
```

### Development

```bash
npm run dev:web      # http://localhost:3000
npm run dev:mobile   # Expo dev server (scan the QR code with Expo Go)
```

### Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run format:check
```

## Deploy to Vercel

Production deployment is documented in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

Quick summary:

1. Import the repo on [Vercel](https://vercel.com) with **Root Directory** = `apps/web`
2. Set environment variables: `DATABASE_URL` and `DIRECT_URL` from [Neon](https://console.neon.tech) (pooled + direct connection strings)
3. Deploy — migrations and `prisma generate` run automatically via `vercel-build`

## Health check

Once the web app is running, `GET /api/health` confirms the API is up and Prisma can reach PostgreSQL.

## Authentication

Registration, login, logout, email verification, phone OTP verification, and password reset are implemented end-to-end (web + mobile), backed by database-held sessions (httpOnly cookie on web, `Authorization: Bearer` token stored in `expo-secure-store` on mobile). See the "Phase 2 — Authentication" section of [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for details. No real email/SMS provider is wired up yet — outgoing messages are logged to the server console by the mock providers in `apps/web/src/server/providers/`.

## Profiles & KYC

User/service-provider and business profiles, service categories, and a full KYC workflow (document upload → submit → admin review → approve/reject) are implemented. Identity documents are stored via a mock filesystem storage provider — only storage keys persist in PostgreSQL. See "Phase 3 — Profiles & KYC" in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Gig marketplace

Gig posting (draft → publish → receiving proposals), discovery with search/filters, attachments, and owner management are implemented. Budget is stored in integer minor currency units. See "Phase 4 — Gig Marketplace" in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).
