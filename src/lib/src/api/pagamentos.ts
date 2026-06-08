import { getApiClient } from './client.js';
import { PagamentoSchema, type Pagamento } from '../schemas/pagamento.js';

export async function getByPedido(idPedido: number): Promise<Pagamento> {
  const r = await getApiClient().get(`/api/v1/pedidos/${idPedido}/pagamento`);
  return PagamentoSchema.parse(r.data);
}
