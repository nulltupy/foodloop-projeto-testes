# Scripts SQL — FoodLoop

Modelo físico do banco de dados do FoodLoop, em PostgreSQL 16.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| [`schema.sql`](schema.sql) | DDL completo: tipos enumerados, 13 tabelas, índices, restrições (PK, FK, UNIQUE, CHECK) e dois triggers (atualização de `nota_media` e devolução de estoque em cancelamento). |
| [`seed.sql`](seed.sql) | Dados de teste: cliente, comerciante, estabelecimento, anúncio, pedido concluído com avaliação e pedido cancelado pelo sistema. |

## Execução

```bash
psql -U <usuario> -d foodloop -f schema.sql
psql -U <usuario> -d foodloop -f seed.sql
```

A documentação do modelo conceitual e relacional está em
[`docs/07-Arquitetura-solucao.md`](../../docs/07-Arquitetura-solucao.md).
