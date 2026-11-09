import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // The files share one database and clean up by e-mail pattern (and auth tests count
    // all users), so they must not run at the same time.
    fileParallelism: false,
    // The app fails fast without JWT_SECRET; e2e tests use a fixed test-only value.
    env: { JWT_SECRET: 'e2e-test-secret-that-is-long-enough-for-hs256' },
  },
});
