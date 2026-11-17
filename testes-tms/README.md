# Projeto de Testes: FoodLoop

Trabalho de **Teste e Manutenção de Software** (PUC Minas, Sistemas de Informação, Campus Betim, 2026/2).

Grupo: Caio Vieira, Cristiano Tupynambá, Eduardo Antunes, Guilherme de Aguilar Coelho,
Gustavo de Aguilar Coelho, Mateus Enrico e Max Augusto.

São 30 casos de teste sobre o FoodLoop (TI de 2026/1):

| Grupo                               | Casos       | Onde está                                                                                     |
| ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| Unitários (Vitest)                  | CT01 a CT10 | [`src/front/src/testes-tms/unitarios.test.ts`](../src/front/src/testes-tms/unitarios.test.ts) |
| Funcionais automatizados (Selenium) | CT11 a CT20 | [`selenium/specs/foodloop.spec.js`](selenium/specs/foodloop.spec.js)                          |
| Funcionais manuais                  | CT21 a CT30 | No plano de testes, com os prints em [`manuais/prints`](manuais/prints)                       |

Também estão aqui as duas refatorações ([`refatoracao/`](refatoracao)), o relatório de defeitos
(no plano de testes, com evidência em [`defeitos/`](defeitos)) e a saída da última execução
([`resultados/`](resultados)).

## Como rodar

Pré-requisitos: Node.js 20+ e o Microsoft Edge (ou o Chrome).

Uma vez só, na raiz do repositório:

```bash
npm install
npm run -w src/lib build
```

### Testes unitários

```bash
npm run -w src/front test:unit
```

### Testes Selenium

Os testes rodam contra o FoodLoop local, com a API simulada pelo MSW dentro do navegador.
Não precisa de banco de dados e nenhuma conta falsa é criada no sistema publicado.

Terminal 1, para subir o FoodLoop em modo de testes:

```bash
npm run -w src/front dev:e2e
```

Terminal 2, para rodar a suíte:

```bash
cd testes-tms/selenium
npm install
npm test
```

Variáveis opcionais:

- `HEADLESS=1`: roda sem abrir a janela do navegador.
- `BROWSER=chrome`: usa o Chrome em vez do Edge.
- `DRIVER_PATH=...`: caminho do msedgedriver/chromedriver, se o Selenium Manager não achar sozinho.

Os prints de cada caso vão para `selenium/evidencias/`.

### Prints dos testes manuais e das refatorações

```bash
cd testes-tms/selenium
node roteiro-manual/capturar-prints.js   # percorre os fluxos CT21 a CT30 e salva as telas
node refatoracao/gerar-prints.js         # gera as imagens de antes/depois do código
```

## O que mudou no código do FoodLoop

- **Modo de testes:** `src/front/src/mocks/browser.ts`, `src/front/.env.e2e`, script `dev:e2e` e o
  `src/front/src/main.tsx`, que liga a API simulada só quando `VITE_USE_MOCKS=true`.
- **Correção do DEF01:** a API simulada passou a respeitar a busca (`q`), igual ao backend
  (`src/front/src/mocks/handlers/anuncios.ts`).
- **Refatoração 1:** `tempoRestante()` saiu de `OfertaDetalhe.tsx` para `src/front/src/lib/tempo.ts`.
- **Refatoração 2:** a mensagem de erro do `finalizar()` do checkout virou
  `src/front/src/features/checkout/mensagens.ts`, e o arquivo passou a usar `moeda()`/`codigoErro()` de `src/lib`.
