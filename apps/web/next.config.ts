import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Workspace packages ship raw TypeScript source (no build step of their
  // own), so Next.js must transpile them itself rather than treating them
  // as pre-built node_modules.
  transpilePackages: ['@magobo/db', '@magobo/shared'],
  // Prisma ships native query-engine binaries — keep them external so Vercel
  // bundles them correctly for serverless functions.
  serverExternalPackages: ['@prisma/client'],
  // We maintain a single consolidated AGENTS.md at the repo root; don't let
  // Next.js regenerate a duplicate per-app copy on every dev server start.
  agentRules: false,
};

export default nextConfig;
