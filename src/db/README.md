# Scripts SQL — FoodLoop (histórico)

> **Aviso (a partir de 2026-06-08).** A fonte da verdade do schema agora é
> `src/back/prisma/schema.prisma` + as migrations em `src/back/prisma/migrations/`.
>
> Os arquivos abaixo são mantidos como **histórico** do DDL original
> elaborado por Guilherme Setragni no Sprint 3 e **não são mais aplicados**
> em runtime. Para alterar o schema, rode `npx prisma migrate dev --name <nome>`
> em `src/back/`.

Modelo físico original do banco de dados do FoodLoop, em PostgreSQL 16.

## Arquivos

| Arquivo                    | Conteúdo                                                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`schema.sql`](schema.sql) | DDL completo: tipos enumerados, 14 tabelas, índices, restrições (PK, FK, UNIQUE, CHECK) e dois triggers (atualização de `nota_media` e devolução de estoque em cancelamento). |
| [`seed.sql`](seed.sql)     | Dados de teste: cliente, comerciante, estabelecimento, anúncio, pedido concluído com avaliação e pedido cancelado pelo sistema.                                               |

A documentação do modelo conceitual e relacional está em
[`docs/07-Arquitetura-solucao.md`](../../docs/07-Arquitetura-solucao.md).
