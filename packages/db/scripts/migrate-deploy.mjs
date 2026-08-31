/**
 * Production migrate with Neon/Vercel env normalization and retries.
 * Neon databases can be asleep on first connect — retry before failing the build.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const dbRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function pickEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

// Runtime (pooled) — Neon ↔ Vercel integration often sets POSTGRES_PRISMA_URL
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = pickEnv('POSTGRES_PRISMA_URL', 'POSTGRES_URL');
}

// Migrations (direct / non-pooled) — integration sets POSTGRES_URL_NON_POOLING
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = pickEnv(
    'POSTGRES_URL_NON_POOLING',
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_URL',
  );
}

if (!process.env.DATABASE_URL) {
  console.error(
    '[migrate-deploy] Missing DATABASE_URL. In Vercel, set DATABASE_URL (Neon pooled string) or connect the Neon integration (POSTGRES_PRISMA_URL).',
  );
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.error(
    '[migrate-deploy] Missing DIRECT_URL. In Vercel, set DIRECT_URL to Neon\'s **Direct connection** string, or map POSTGRES_URL_NON_POOLING from the Neon integration.',
  );
  process.exit(1);
}

const maxAttempts = 5;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  console.log(`[migrate-deploy] prisma migrate deploy — attempt ${attempt}/${maxAttempts}`);

  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: process.env,
    cwd: dbRoot,
  });

  if (result.status === 0) {
    console.log('[migrate-deploy] Migrations applied successfully.');
    process.exit(0);
  }

  if (attempt < maxAttempts) {
    const delayMs = attempt * 4000;
    console.warn(
      `[migrate-deploy] Could not reach Neon (P1001 is common when the DB is waking). Retrying in ${delayMs / 1000}s…`,
    );
    await sleep(delayMs);
  }
}

console.error(
  '[migrate-deploy] All attempts failed. Check Vercel env vars:\n' +
    '  DATABASE_URL = Neon **Pooled** connection\n' +
    '  DIRECT_URL   = Neon **Direct** connection (not the pooler host)\n' +
    'Wake the project at https://console.neon.tech then redeploy.',
);
process.exit(1);
