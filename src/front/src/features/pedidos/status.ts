import type { StatusPedido } from '@foodloop/lib';

// Rótulos legíveis para cada status do pedido.
export const ROTULO_STATUS: Record<StatusPedido, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  PRONTO_PARA_RETIRADA: 'Pronto para retirada',
  RETIRADO: 'Retirado',
  CANCELADO: 'Cancelado',
};

// Pedidos ainda em andamento (não retirados nem cancelados).
export const STATUS_ATIVOS: StatusPedido[] = ['RECEBIDO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA'];

export function ehAtivo(status: StatusPedido): boolean {
  return STATUS_ATIVOS.includes(status);
}

// Cor do selo de status (Hortelã). Pronto = verde, preparo = âmbar,
// cancelado = vermelho, recebido/retirado = neutros.
export const BADGE_STATUS: Record<StatusPedido, string> = {
  RECEBIDO: 'bg-leaf-50 text-leaf-dark',
  EM_PREPARO: 'bg-amber-50 text-[#8a5b00]',
  PRONTO_PARA_RETIRADA: 'bg-leaf text-white',
  RETIRADO: 'bg-canvas text-ink-mute',
  CANCELADO: 'bg-danger-50 text-danger-dark',
};
