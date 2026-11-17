import { codigoErro } from '../../lib/erros';

// Mensagens da reserva no checkout.
// Refatoração 2 do Projeto de Testes: antes essa decisão ficava dentro do
// método finalizar() do Checkout, que ainda tinha a própria cópia de
// codigoErro() e de moeda() (as duas já existiam em src/lib).

export const MSG_ITEM_ESGOTADO = 'Um dos itens não está mais disponível.';
export const MSG_FALHA_RESERVA = 'Não foi possível concluir a reserva. Tente novamente.';

export function mensagemFalhaReserva(e: unknown): string {
  return codigoErro(e) === 'ANUNCIO_ESGOTADO' ? MSG_ITEM_ESGOTADO : MSG_FALHA_RESERVA;
}
