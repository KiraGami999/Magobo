/**
 * Vercel production build: migrate (unless skipped) then next build.
 */
import { spawnSync } from 'node:child_process';

function run(command, args, label) {
  console.log(`[vercel-build] ${label}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.SKIP_DB_MIGRATE === '1') {
  console.warn('[vercel-build] SKIP_DB_MIGRATE=1 — skipping prisma migrate deploy.');
} else {
  run('npm', ['run', 'migrate:deploy', '--workspace=@magobo/db'], 'Applying database migrations');
}

run('npm', ['run', 'build', '--workspace=@magobo/web'], 'Building Next.js app');
