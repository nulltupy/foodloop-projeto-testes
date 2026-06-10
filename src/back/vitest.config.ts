import { defineConfig } from 'vitest/config';

// Em CI o DATABASE_URL vem do workflow. Localmente os testes usam um banco
// dedicado (foodloop_test): o setup trunca tudo a cada teste e apagaria os
// dados de dev/seed se rodasse contra o banco do .env.
const LOCAL_TEST_DB = 'postgresql://foodloop:foodloop@localhost:5433/foodloop_test';

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: 'test-secret-do-not-use-in-prod-32-chars',
      DATABASE_URL: process.env.DATABASE_URL ?? LOCAL_TEST_DB,
    },
    setupFiles: ['./test/setup.ts'],
    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    passWithNoTests: true,
  },
});
