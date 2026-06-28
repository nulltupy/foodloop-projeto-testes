import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { RouteProps } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { CadastroCliente } from './CadastroCliente';
import { CadastroComerciante } from './CadastroComerciante';
import { useAuthStore } from '../store';
import { db } from '../../../mocks/db';
import { server } from '../../../mocks/server';

function renderPagina(elemento: RouteProps['element'], rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path={rota} element={elemento} />
        <Route path="/" element={<div>home do cliente</div>} />
        <Route path="/comerciante" element={<div>painel do comerciante</div>} />
        <Route path="/comerciante/cardapio" element={<div>cardápio do comerciante</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ usuario: null, token: null });
  localStorage.clear();
});

describe('Cadastro de cliente', () => {
  it('tem os campos rotulados', () => {
    renderPagina(<CadastroCliente />, '/cadastro/cliente');
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('cadastro válido redireciona para a home', async () => {
    renderPagina(<CadastroCliente />, '/cadastro/cliente');
    await userEvent.type(screen.getByLabelText('Nome'), 'Novo Cliente');
    await userEvent.type(screen.getByLabelText('E-mail'), 'novo@foodloop.dev');
    await userEvent.type(screen.getByLabelText('Telefone'), '+5511988887777');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha12345');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText('home do cliente')).toBeInTheDocument();
    expect(useAuthStore.getState().usuario?.tipo).toBe('cliente');
  });

  it('e-mail já cadastrado mostra mensagem de erro', async () => {
    renderPagina(<CadastroCliente />, '/cadastro/cliente');
    await userEvent.type(screen.getByLabelText('Nome'), 'Cliente Demo');
    await userEvent.type(screen.getByLabelText('E-mail'), 'cliente@foodloop.dev');
    await userEvent.type(screen.getByLabelText('Telefone'), '+5511988887777');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha12345');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/já cadastrado/i);
  });
});

describe('Cadastro de comerciante', () => {
  it('cadastra conta e loja em duas etapas antes de entrar no painel', async () => {
    server.use(
      http.get('https://viacep.com.br/ws/:cep/json/', () =>
        HttpResponse.json({
          cep: '32600-000',
          logradouro: 'Avenida Amazonas',
          bairro: 'Centro',
          localidade: 'Betim',
          uf: 'MG',
        }),
      ),
    );

    renderPagina(<CadastroComerciante />, '/cadastro/comerciante');
    expect(screen.getByLabelText('CNPJ')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Nome do responsável'), 'Dona da Loja');
    await userEvent.type(screen.getByLabelText('E-mail'), 'loja@foodloop.dev');
    await userEvent.type(screen.getByLabelText('CNPJ'), '12345678000100');
    await userEvent.type(screen.getByLabelText('Telefone'), '+5511977776666');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha12345');
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha12345');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(await screen.findByLabelText('Nome da loja')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nome da loja'), 'Padaria da Dona');
    await userEvent.type(screen.getByLabelText('Descrição curta'), 'Pães e salgados do dia');
    await userEvent.type(screen.getByLabelText('CEP'), '32600-000');
    expect(await screen.findByDisplayValue('Avenida Amazonas')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Número'), '100');
    await userEvent.click(screen.getByRole('button', { name: /criar conta e loja/i }));

    expect(await screen.findByText('cardápio do comerciante')).toBeInTheDocument();
    expect(useAuthStore.getState().usuario?.tipo).toBe('comerciante');
    const usuario = db.usuarios.find((u) => u.email === 'loja@foodloop.dev');
    expect(usuario?.id_estabelecimento).toBeTruthy();
    const estabelecimento = db.estabelecimentos.find((e) => e.id === usuario?.id_estabelecimento);
    expect(estabelecimento).toMatchObject({
      nome_fantasia: 'Padaria da Dona',
      horario_funcionamento: null,
    });
  });
});
