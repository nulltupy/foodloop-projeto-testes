import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './lib/api';
import { App } from './app/App';
import './index.css';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Modo e2e (testes Selenium do Projeto de Testes): liga a API simulada do MSW
// antes de montar a tela. Fora desse modo não faz nada.
async function prepararMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
}

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root ausente em index.html');

void prepararMocks().then(() => {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  );
});
