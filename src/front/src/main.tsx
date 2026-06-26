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

// Liga o Mock Service Worker quando VITE_USE_MSW=true (front roda sem o back).
async function iniciarMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MSW !== 'true') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

function renderApp(): void {
  const root = document.getElementById('root');
  if (!root) throw new Error('Elemento #root ausente em index.html');

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

// Renderiza independentemente do MSW: se a inicialização dos mocks falhar, o app
// ainda sobe (apontando para a API real) em vez de ficar com a tela em branco.
void iniciarMocks()
  .catch((erro) => {
    console.error('Falha ao iniciar o Mock Service Worker; seguindo sem mocks.', erro);
  })
  .finally(renderApp);
