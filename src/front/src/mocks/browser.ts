import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Worker do MSW para rodar o front no navegador sem backend.
// Usado só no modo "e2e" (npm run dev:e2e), que é o ambiente dos testes
// Selenium do Projeto de Testes (TMS). Em dev normal e em produção, não carrega.
export const worker = setupWorker(...handlers);
