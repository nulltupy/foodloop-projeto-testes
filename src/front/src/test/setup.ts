import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '../mocks/server';
import { resetarDb } from '../mocks/db';
// Registra o api client (@foodloop/lib) para os testes de tela.
import '../lib/api';

// Os testes rodam sempre contra os handlers do MSW.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetarDb();
});
afterAll(() => server.close());
