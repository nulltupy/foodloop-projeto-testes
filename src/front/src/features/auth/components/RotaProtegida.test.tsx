import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { RotaProtegida } from './RotaProtegida';
import { useAuthStore } from '../store';

function renderEm(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/login" element={<div>tela de login</div>} />
        <Route path="/" element={<div>home pública</div>} />
        <Route element={<RotaProtegida />}>
          <Route path="/privado" element={<div>área privada</div>} />
        </Route>
        <Route element={<RotaProtegida tipo="comerciante" />}>
          <Route path="/comerciante" element={<div>área do comerciante</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ usuario: null, token: null });
  localStorage.clear();
});

describe('RotaProtegida', () => {
  it('redireciona para /login quando não autenticado', () => {
    renderEm('/privado');
    expect(screen.getByText('tela de login')).toBeInTheDocument();
  });

  it('redireciona para / quando o tipo do usuário não bate', () => {
    useAuthStore
      .getState()
      .setSession({ id: 1, nome: 'Cliente', email: 'c@foodloop.dev', tipo: 'cliente' }, 'tok');
    renderEm('/comerciante');
    expect(screen.getByText('home pública')).toBeInTheDocument();
  });

  it('libera a rota quando o tipo bate', () => {
    useAuthStore
      .getState()
      .setSession({ id: 2, nome: 'Loja', email: 'l@foodloop.dev', tipo: 'comerciante' }, 'tok');
    renderEm('/comerciante');
    expect(screen.getByText('área do comerciante')).toBeInTheDocument();
  });
});
