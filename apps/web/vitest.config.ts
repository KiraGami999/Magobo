import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // `server-only`'s default export throws unless bundled under Next.js's
      // "react-server" condition. Vitest runs plain Node, so point it at the
      // package's no-op build instead — the guard is meaningless in tests.
      'server-only': path.resolve(__dirname, '../../node_modules/server-only/empty.js'),
    },
  },
});
