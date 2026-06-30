import type { CreateEstabelecimentoRequest } from '@foodloop/lib';

// Coluna é Char(9): normaliza para o formato com hífen (#####-###).
export function normalizarCep(cep: string): string {
  const digitos = cep.replace(/\D/g, '');
  return `${digitos.slice(0, 5)}-${digitos.slice(5, 8)}`;
}

// Queries de geocoding da mais específica para a mais ampla. O Nominatim falha
// com frequência no número e no bairro de endereços brasileiros, então caímos
// até rua/cidade. Não caímos para bairro ou cidade somente, porque isso salvaria
// coordenadas genéricas enquanto o endereço parece exato para o cliente.
export function queriesGeocoding(e: CreateEstabelecimentoRequest['endereco']): string[] {
  const montar = (...partes: (string | undefined)[]) =>
    partes.filter((p) => p && p.trim().length > 0).join(', ');
  const candidatas = [
    montar(e.rua, e.numero, e.bairro, e.cidade, e.estado, 'Brasil'),
    montar(e.rua, e.bairro, e.cidade, e.estado, 'Brasil'),
    montar(e.rua, e.cidade, e.estado, 'Brasil'),
  ];
  return candidatas.filter((q, i) => q.length > 0 && candidatas.indexOf(q) === i);
}
