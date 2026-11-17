// Testes unitários do Projeto de Testes (TMS) — CT01 a CT10.
// Rodar só esta suíte: npm run -w src/front test:unit
import { describe, it, expect, beforeEach } from 'vitest';
import {
  CriarPedidoRequestSchema,
  ListarAnunciosQuerySchema,
  RegisterRequestSchema,
  gerarCodigoRetirada,
} from '@foodloop/lib';
import { moeda } from '../lib/format';
import { mensagemErro } from '../lib/erros';
import { tempoRestante, PRAZO_ENCERRADO } from '../lib/tempo';
import { ehAtivo } from '../features/pedidos/status';
import { useCarrinho } from '../features/checkout/store';
import { mensagemFalhaReserva, MSG_FALHA_RESERVA, MSG_ITEM_ESGOTADO } from '../features/checkout/mensagens';

// Monta um erro no formato que o axios devolve quando a API responde com falha.
function erroDaApi(code: string, message = 'mensagem da API') {
  return { response: { status: 409, data: { error: { code, message } } } };
}

const cadastroValido = {
  nome: 'Ana Souza',
  email: 'ana@teste.dev',
  senha: 'senhaForte1',
  telefone: '+5531988887777',
  tipo: 'cliente' as const,
};

describe('Testes unitários — FoodLoop', () => {
  it('CT01 - Formatar valores em reais', () => {
    // toLocaleString usa um espaço "não separável" depois do R$, por isso o \s.
    expect(moeda(1234.5)).toMatch(/^R\$\s1\.234,50$/);
    expect(moeda(0)).toMatch(/^R\$\s0,00$/);
    expect(moeda(9.999)).toMatch(/^R\$\s10,00$/);
  });

  it('CT02 - Identificar se um pedido ainda está em andamento', () => {
    expect(ehAtivo('RECEBIDO')).toBe(true);
    expect(ehAtivo('EM_PREPARO')).toBe(true);
    expect(ehAtivo('PRONTO_PARA_RETIRADA')).toBe(true);
    expect(ehAtivo('RETIRADO')).toBe(false);
    expect(ehAtivo('CANCELADO')).toBe(false);
  });

  it('CT03 - Escolher a mensagem de erro certa para o usuário', () => {
    expect(mensagemErro(erroDaApi('X', 'Estoque acabou'), 'padrão')).toBe('Estoque acabou');
    expect(mensagemErro(new Error('Sem conexão'), 'padrão')).toBe('Sem conexão');
    expect(mensagemErro(undefined, 'Algo deu errado')).toBe('Algo deu errado');
  });

  it('CT04 - Calcular o tempo que falta para retirar a oferta', () => {
    const agora = Date.parse('2026-11-18T10:00:00.000Z');
    expect(tempoRestante('2026-11-18T11:01:05.000Z', agora)).toBe('01:01:05');
    expect(tempoRestante('2026-11-18T10:00:09.000Z', agora)).toBe('00:00:09');
    expect(tempoRestante('2026-11-18T10:00:00.000Z', agora)).toBe(PRAZO_ENCERRADO);
    expect(tempoRestante('2026-11-18T09:00:00.000Z', agora)).toBe(PRAZO_ENCERRADO);
  });

  describe('Carrinho', () => {
    beforeEach(() => useCarrinho.getState().limpar());

    it('CT05 - Não duplicar a mesma oferta no carrinho e somar o total', () => {
      const item = { id_anuncio: 7, quantidade: 2, preco: 12.5, produto_nome: 'Pão de queijo' };
      useCarrinho.getState().adicionar(item);
      useCarrinho.getState().adicionar(item);

      expect(useCarrinho.getState().itens).toHaveLength(1);
      expect(useCarrinho.getState().total()).toBe(25);

      useCarrinho.getState().limpar();
      expect(useCarrinho.getState().total()).toBe(0);
    });
  });

  it('CT06 - Exigir CNPJ no cadastro de comerciante', () => {
    expect(RegisterRequestSchema.safeParse(cadastroValido).success).toBe(true);

    const semCnpj = RegisterRequestSchema.safeParse({ ...cadastroValido, tipo: 'comerciante' });
    expect(semCnpj.success).toBe(false);
    expect(semCnpj.error?.issues[0]?.path).toEqual(['cnpj']);

    const cnpjComMascara = RegisterRequestSchema.safeParse({
      ...cadastroValido,
      tipo: 'comerciante',
      cnpj: '12.345.678/0001-99',
    });
    expect(cnpjComMascara.success).toBe(false);
  });

  it('CT07 - Validar o tamanho da senha (mínimo 8 caracteres, máximo 72 bytes)', () => {
    const comSenha = (senha: string) => RegisterRequestSchema.safeParse({ ...cadastroValido, senha }).success;
    expect(comSenha('1234567')).toBe(false); // 7 caracteres
    expect(comSenha('12345678')).toBe(true); // 8 caracteres
    expect(comSenha('a'.repeat(72))).toBe(true); // 72 bytes
    expect(comSenha('ç'.repeat(37))).toBe(false); // 37 letras, mas 74 bytes
  });

  it('CT08 - Limitar o pedido a 1 item com até 20 unidades', () => {
    const pedido = (itens: { id_anuncio: number; quantidade: number }[]) =>
      CriarPedidoRequestSchema.safeParse({ itens }).success;
    expect(pedido([{ id_anuncio: 1, quantidade: 20 }])).toBe(true);
    expect(pedido([{ id_anuncio: 1, quantidade: 21 }])).toBe(false);
    expect(pedido([{ id_anuncio: 1, quantidade: 0 }])).toBe(false);
    expect(pedido([])).toBe(false);
    expect(
      pedido([
        { id_anuncio: 1, quantidade: 1 },
        { id_anuncio: 2, quantidade: 1 },
      ]),
    ).toBe(false);
  });

  it('CT09 - Tratar os filtros da busca de ofertas', () => {
    const query = ListarAnunciosQuerySchema.parse({ lat: '-19.95', lng: '-44.19', q: '   ' });
    expect(query.lat).toBe(-19.95); // texto da URL vira número
    expect(query.raio_km).toBe(5); // valor padrão
    expect(query.pagina).toBe(1); // valor padrão
    expect(query.q).toBeUndefined(); // busca só com espaços é ignorada

    expect(ListarAnunciosQuerySchema.parse({ lat: 0, lng: 0, q: '  pão ' }).q).toBe('pão');
    expect(ListarAnunciosQuerySchema.safeParse({ lat: 91, lng: 0 }).success).toBe(false);
  });

  it('CT10 - Gerar código de retirada e mensagem de falha na reserva', () => {
    for (let i = 0; i < 200; i++) {
      const codigo = gerarCodigoRetirada();
      expect(codigo).toMatch(/^[A-HJKMNP-Z2-9]{8}$/); // sem I, L, O, 0 e 1
    }
    expect(mensagemFalhaReserva(erroDaApi('ANUNCIO_ESGOTADO'))).toBe(MSG_ITEM_ESGOTADO);
    expect(mensagemFalhaReserva(erroDaApi('ERRO_INTERNO'))).toBe(MSG_FALHA_RESERVA);
    expect(mensagemFalhaReserva(new Error('rede'))).toBe(MSG_FALHA_RESERVA);
  });
});
