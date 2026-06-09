import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Worker do MSW usado no navegador (ligado quando VITE_USE_MSW=true).
export const worker = setupWorker(...handlers);
