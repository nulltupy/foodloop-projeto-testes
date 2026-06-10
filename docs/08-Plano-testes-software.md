# Plano de testes de software

Este plano cobre o MVP do FoodLoop: cadastro e login, acesso protegido, listagem de ofertas, detalhe da oferta, reserva, confirmação do pedido e regras compartilhadas entre front-end e back-end.

Usuários avaliados: consumidor e comerciante. Ferramentas: Vitest, Supertest, Testing Library, MSW e navegador web.

## Casos de teste

| Teste                    | Requisitos             | Procedimento                                                                       | Critério de êxito                                                                                                |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1. Cadastro de usuário   | RF-001, RNF-002        | Preencher cadastro de consumidor e comerciante; tentar cadastrar e-mail duplicado. | Conta válida é criada; dados inválidos exibem erro claro; senha não aparece nas respostas.                       |
| 2. Login e sessão        | RF-001, RNF-002        | Entrar com credenciais válidas e inválidas; sair da conta.                         | Login válido cria sessão; credenciais inválidas são recusadas; logout limpa a sessão.                            |
| 3. Acesso protegido      | RF-001                 | Acessar rotas sem login, como consumidor e como comerciante.                       | Usuário sem sessão volta ao login; perfil errado é bloqueado; perfil correto acessa a rota.                      |
| 4. Listagem de ofertas   | RF-003, RNF-004        | Abrir a tela inicial, listar ofertas próximas e aplicar filtros.                   | Ofertas disponíveis aparecem ordenadas por distância; filtro sem resultado mostra mensagem útil.                 |
| 5. Detalhe da oferta     | RF-002, RF-003         | Abrir uma oferta, conferir informações e simular oferta esgotada.                  | Dados da oferta aparecem corretamente; reserva fica indisponível quando não há estoque.                          |
| 6. Reserva e confirmação | RF-004, RF-011         | Adicionar item ao checkout, confirmar pedido e abrir a tela de confirmação.        | Total é calculado; pedido é criado; código de retirada e status são exibidos.                                    |
| 7. Perfil do usuário     | RF-001                 | Consultar e atualizar dados permitidos do usuário autenticado.                     | Dados são retornados sem senha; campos permitidos são atualizados; campos bloqueados são ignorados ou recusados. |
| 8. Regras compartilhadas | RF-001, RF-004, RF-011 | Validar schemas de cadastro/login e geração do código de retirada.                 | Dados fora do contrato são rejeitados; código gerado tem tamanho e caracteres adequados.                         |

## Execução

Os testes automatizados devem ser executados com:

```bash
npm run -w src/lib test
npm run -w src/back test
npm run -w src/front test
```

Para evidência visual, gravar um screencast curto do fluxo principal: cadastro/login, listagem de ofertas, reserva e confirmação do pedido.
