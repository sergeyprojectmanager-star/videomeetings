import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // The app fails fast without JWT_SECRET; e2e tests use a fixed test-only value.
    env: { JWT_SECRET: 'e2e-test-secret-that-is-long-enough-for-hs256' },
  },
});
