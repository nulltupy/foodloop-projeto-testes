import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: 'test-secret-do-not-use-in-prod-32-chars',
    },
    setupFiles: ['./test/setup.ts'],
    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    passWithNoTests: true,
  },
});
