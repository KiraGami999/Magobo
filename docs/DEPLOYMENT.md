# Deploying Magobo Web to Vercel

This guide covers deploying the **Next.js web app** (`apps/web`) from the Magobo monorepo to [Vercel](https://vercel.com), using your existing **Neon** PostgreSQL database.

## Prerequisites

- Git repository pushed to GitHub, GitLab, or Bitbucket (or import directly into Vercel)
- A [Neon](https://neon.tech) project with migrations already applied (or let the Vercel build run them)
- Node.js ≥ 20 locally (for optional manual checks)

## 1. Create the Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) and import your Magobo repository.
2. Set **Root Directory** to `apps/web` (important — this is a monorepo).
3. Vercel should detect **Next.js**. The repo includes `apps/web/vercel.json`, which runs install/build from the monorepo root so workspace packages (`@magobo/db`, `@magobo/shared`) resolve correctly.
4. **Framework Preset:** Next.js  
5. **Build Command:** (auto from `vercel.json`) `npm run vercel-build --prefix ../..`  
6. **Install Command:** (auto) `npm install --prefix ../..`  
7. **Output Directory:** leave default (`.next`)

## 2. Environment variables

Add these in **Vercel → Project → Settings → Environment Variables** for **Production** (and Preview if you want preview deployments to work):

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `DATABASE_URL` | **Yes** | Neon **Pooled** connection string ([Connect](https://console.neon.tech) → Pooled). Or use Neon ↔ Vercel integration (`POSTGRES_PRISMA_URL` is mapped automatically). |
| `DIRECT_URL` | **Yes** | Neon **Direct connection** string (same page, **not** the pooler host). Or map from integration: `POSTGRES_URL_NON_POOLING`. **This is the usual cause of build failure P1001 if missing or wrong.** |
| `PAYCHANGU_PORTAL_URL` | No | Your PayChangu dashboard URL. Defaults to `https://dashboard.paychangu.com` if omitted. |

### Neon ↔ Vercel integration

If you connected Neon to Vercel in the Neon dashboard, these may appear automatically:

| Neon sets on Vercel | Used for |
|---------------------|----------|
| `POSTGRES_PRISMA_URL` | Runtime queries (→ `DATABASE_URL`) |
| `POSTGRES_URL_NON_POOLING` | Migrations at build (→ `DIRECT_URL`) |

The build script (`packages/db/scripts/migrate-deploy.mjs`) maps those names. You still need **both** a pooled and a direct string available — if the build fails with **P1001**, open [console.neon.tech](https://console.neon.tech), wake the project, and confirm **Direct connection** works.

### Neon connection details (manual setup)

1. Sign in at [console.neon.tech](https://console.neon.tech).
2. Open project **magobo** (or your project name).
3. Click **Connect** on the dashboard.
4. **Pooled connection** → copy → paste as `DATABASE_URL` in Vercel.
5. **Direct connection** → copy → paste as `DIRECT_URL` in Vercel.
6. Use the same database name/user/password for both; only the host suffix differs (`-pooler` vs direct endpoint).

> **Tip:** Neon databases sleep when idle. The first request after sleep may take a few seconds. You can disable auto-suspend on paid plans or wake the DB from the Neon console before testing.

### Variables you do **not** need on Vercel

| Variable | Reason |
|----------|--------|
| `NODE_ENV` | Set automatically to `production` |
| Auth secrets | Sessions use DB-backed tokens; no JWT secret required |
| Email/SMS API keys | Mock providers log to console until real providers are integrated |

## 3. Deploy

Click **Deploy**. Each build will:

1. `npm install` at monorepo root (runs `postinstall` → `prisma generate`)
2. `prisma migrate deploy` (applies pending migrations to Neon)
3. `next build` (production-optimized bundle)

After deploy, open your Vercel URL (e.g. `https://magobo-xxx.vercel.app`).

### Health check

Visit `https://YOUR-DOMAIN/api/health` — expect `{ "success": true, ... }` when the DB is reachable.

## 4. Custom domain

1. Vercel → Project → **Settings** → **Domains**
2. Add your domain (e.g. `magobo.com` or `app.magobo.com`)
3. Follow DNS instructions (CNAME to `cname.vercel-dns.com` or A records as shown)
4. SSL is provisioned automatically

## 5. Local vs production

| | Local | Vercel |
|---|--------|--------|
| Web app | `npm run dev:web` → `http://localhost:3000` | `https://your-domain.vercel.app` |
| Env file | `apps/web/.env.local` | Vercel dashboard env vars |
| DB env | `packages/db/.env` (same values mirrored in web) | Only in Vercel (web app reads `DATABASE_URL` at runtime) |
| Migrations | `npm run db:migrate` | Automatic on each deploy via `vercel-build` |

## 6. Mobile app (Expo)

After deploying web, point the mobile app at your live API:

```bash
# apps/mobile/.env
EXPO_PUBLIC_API_URL=https://YOUR-DOMAIN.vercel.app
```

## Known production limitations

These are architectural seams — not Vercel-specific bugs:

| Feature | Status on Vercel |
|---------|------------------|
| **KYC / file uploads** | Uses **local disk** mock storage (`.storage/`). On Vercel, uploads are **ephemeral** and won't persist across deployments. For production KYC, integrate S3/R2/Cloudflare R2 and swap `storageProvider`. |
| **Email / SMS** | Mock — logs to function logs in Vercel → **Logs** tab |
| **Payments** | PayChangu portal link only — no escrow processing |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on `prisma generate` | Ensure `DATABASE_URL` and `DIRECT_URL` are set in Vercel **before** deploy; check build logs |
| `Can't reach database` at runtime | Wake Neon; verify **pooled** `DATABASE_URL`; check IP allowlist (Neon allows all by default) |
| Login works locally but not on Vercel | Cookies use `secure: true` in production — site must be **HTTPS** (Vercel provides this) |
| 500 on first request after idle | Neon cold start — retry or disable suspend |
| Monorepo "module not found @magobo/db" | Confirm Root Directory is `apps/web` and `vercel.json` install command uses `--prefix ../..` |

## Optional: deploy from CLI

```bash
npm i -g vercel
cd apps/web
vercel link
vercel env pull .env.local   # pull env vars locally
vercel --prod
```

---

See also [`apps/web/.env.example`](../apps/web/.env.example) and the root [`README.md`](../README.md).
