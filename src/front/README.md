# `@foodloop/front`

Aplicação web do FoodLoop. SPA em React 19 + Vite, consome o backend via cliente HTTP exportado por `@foodloop/lib`.

## Stack

- **Build:** Vite 5
- **UI:** React 19 + React Router v6
- **Estilo:** Tailwind 3 (tokens em `tailwind.config.ts`)
- **Estado servidor:** TanStack Query 5
- **Estado cliente:** Zustand 4
- **Formulários:** React Hook Form + Zod via `@hookform/resolvers`
- **HTTP:** `axios` (transitivo via `@foodloop/lib`), inicializado em `src/lib/api.ts`
- **Testes:** Vitest + @testing-library/react + jsdom

## Como rodar

Pré-requisitos: `npm install` na raiz do monorepo e build inicial do pacote portável:

```bash
npm run -w src/lib build
```

Suba o dev server (porta fixa 5173):

```bash
npm run -w src/front dev
```

Aponte para um backend rodando. O padrão é `http://localhost:3010` (mesma porta do `src/back`). Para usar outro endereço, copie o exemplo:

```bash
cp src/front/.env.example src/front/.env
# edite VITE_API_URL conforme necessário
```

## Scripts

| Script                           | O que faz                                                   |
| -------------------------------- | ----------------------------------------------------------- |
| `npm run -w src/front dev`       | Vite dev server em `localhost:5173` (hot reload)            |
| `npm run -w src/front build`     | Typecheck + build de produção em `dist/`                    |
| `npm run -w src/front preview`   | Serve o build de produção localmente                        |
| `npm run -w src/front typecheck` | `tsc --noEmit`                                              |
| `npm run -w src/front lint`      | ESLint (config root, regras de React em `eslint.config.js`) |
| `npm run -w src/front test`      | Vitest, modo run-once                                       |

## Layout

```
src/front/
├── index.html            # entry HTML, monta /src/main.tsx
├── vite.config.ts        # defineConfig de vitest/config (campo `test` reconhecido)
├── tailwind.config.ts    # tokens brand/accent/danger/ink/surface
├── postcss.config.js     # ESM (workspace é type:module)
├── tsconfig.json         # estende tsconfig.base.json
└── src/
    ├── main.tsx          # React root + providers (Router, Query)
    ├── index.css         # @tailwind directives
    ├── app/
    │   ├── App.tsx       # rotas (placeholder em `/`)
    │   └── App.test.tsx  # smoke: render do `/` + import do @foodloop/lib
    ├── lib/api.ts        # createApiClient + setApiClient do @foodloop/lib
    └── test/setup.ts     # @testing-library/jest-dom matchers (vitest setupFiles)
```

`src/lib/api.ts` é importado por efeito colateral em `main.tsx` antes do `<App />` para garantir que o cliente HTTP esteja registrado quando os componentes montarem.

## Notas

- **React 19, não 18.** Prisma 7 do back puxa `react@19` que sobe ao hoist do monorepo. Front também usa 19 para evitar duplicidade no jsdom dos testes.
- **Tailwind v3.** Plan B do card mencionava v4; a v3 mantém a config previsível com `postcss-load-config`.
- **Sem MSW ainda.** A flag `VITE_USE_MSW` já existe no `.env.example` mas o handler entra em card próprio.

## Segurança — trade-offs conhecidos

- **JWT em `localStorage`.** `src/lib/api.ts` lê e escreve o token em `localStorage['foodloop:token']`. Isso é exposto a XSS por design — `HttpOnly` cookies não são uma opção enquanto front e back vivem em domínios diferentes (Vercel + Render). Mitigação fica para o endurecimento de auth + CSP no pós-MVP.
- **`vitest --ui` é proibido.** A versão `vitest@^2.1.2` carrega o advisory crítico GHSA-5xrq-8626-4rwp (servidor UI lê/executa arquivos arbitrários). O script `test` roda em modo `vitest run` (sem servidor), então não há exposição. Não use `--ui` localmente até subirmos para `vitest@^3.2.6`.
