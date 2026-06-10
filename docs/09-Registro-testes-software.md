# Registro de testes de software

Registro baseado no plano de testes de software e nos testes automatizados do repositório.

## Evidências

| Teste                 | Requisitos             | Evidência                                                                                                                                                                  | Status                                         |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Cadastro de usuário   | RF-001, RNF-002        | `src/back/src/modules/auth/auth.test.ts`; `src/front/src/features/auth/pages/Cadastro.test.tsx`; `src/lib/src/schemas/auth.test.ts`                                        | Coberto por teste automatizado.                |
| Login e sessão        | RF-001, RNF-002        | `src/back/src/modules/auth/auth.test.ts`; `src/front/src/features/auth/pages/Login.test.tsx`; `src/front/src/features/auth/store.test.ts`                                  | Coberto por teste automatizado.                |
| Acesso protegido      | RF-001                 | `src/back/src/shared/middlewares/auth.test.ts`; `src/front/src/features/auth/components/RotaProtegida.test.tsx`                                                            | Coberto por teste automatizado.                |
| Listagem de ofertas   | RF-003, RNF-004        | `src/front/src/features/ofertas/pages/Home.test.tsx`; `src/front/src/mocks/handlers.test.ts`                                                                               | Coberto por teste automatizado.                |
| Detalhe da oferta     | RF-002, RF-003         | `src/front/src/features/ofertas/pages/OfertaDetalhe.test.tsx`; `src/front/src/mocks/handlers.test.ts`                                                                      | Coberto por teste automatizado.                |
| Reserva e confirmação | RF-004, RF-011         | `src/front/src/features/checkout/pages/Checkout.test.tsx`; `src/front/src/features/pedidos/pages/PedidoConfirmacao.test.tsx`; `src/lib/src/domain/codigo-retirada.test.ts` | Coberto por teste automatizado.                |
| Perfil do usuário     | RF-001                 | `src/back/src/modules/usuarios/service.test.ts`                                                                                                                            | Coberto por teste automatizado.                |
| Regras compartilhadas | RF-001, RF-004, RF-011 | `src/lib/src/schemas/auth.test.ts`; `src/lib/src/domain/codigo-retirada.test.ts`                                                                                           | Executado com sucesso no pacote compartilhado. |

## Resultado da execução local

Em 09/06/2026, os testes do pacote compartilhado passaram: 2 arquivos, 9 testes. A execução completa local ficou pendente porque o banco de teste do back-end não estava preparado e o front-end não carregou uma dependência local do Vite.

## Avaliação

Os testes cobrem os fluxos centrais do MVP e as regras críticas de autenticação, listagem, reserva e confirmação. As próximas evidências devem ser um screencast do fluxo principal no navegador e uma nova execução completa após preparar o banco local e reinstalar as dependências do front-end.
