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

// Classes do badge por status, usando os tokens do design system.
export const BADGE_STATUS: Record<StatusPedido, string> = {
  RECEBIDO: 'bg-accent-500/10 text-accent-600',
  EM_PREPARO: 'bg-brand-50 text-brand-700',
  PRONTO_PARA_RETIRADA: 'bg-brand-100 text-brand-800',
  RETIRADO: 'bg-surface-100 text-ink-500',
  CANCELADO: 'bg-danger-500/10 text-danger-600',
};
