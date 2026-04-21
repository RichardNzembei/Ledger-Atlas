import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.int.test.ts'],
    // Integration tests spin up containers — generous timeout
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // Run serially so containers don't race
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
