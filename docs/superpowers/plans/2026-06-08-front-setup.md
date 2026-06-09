# Front setup (Vite + React + TS + Tailwind + Router + RQ + Zustand) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `src/front` so any UI work can begin: Vite dev server on `localhost:5173` serves a placeholder page that uses Tailwind tokens and successfully imports `@foodloop/lib`.

**Architecture:** Workspace package `@foodloop/front` (already declared in root `package.json` workspaces). React 18 + React Router v6 + TanStack Query + Zustand for state, axios via `@foodloop/lib`'s `createApiClient`, Tailwind v3 for styling, Vitest + Testing Library for tests. No MSW, no auth screens, no PWA — those land in later cards.

**Tech Stack:** Vite 5, React 18, TypeScript 5, react-router-dom 6, @tanstack/react-query 5, zustand 4, axios (transitive via `@foodloop/lib`), react-hook-form + @hookform/resolvers + zod, Tailwind 3, Vitest + @testing-library/react + jsdom.

## Reality checks vs. card text

The card under `1-auth`-adjacent specs was written before some setup landed. The truths to follow over the card:

1. `@foodloop/lib` exports the API client under the `api` namespace, not flat: `import { api } from '@foodloop/lib'` → `api.createApiClient`, `api.setApiClient`. Don't try `import { createApiClient } from '@foodloop/lib'` — it won't resolve.
2. `@foodloop/lib` ships from `dist/`. Build it once before front typecheck: `npm run -w src/lib build`.
3. Backend dev port is **3010**, not 3000 (`src/back/.env.example`). The front `.env.example` must match.
4. Root `eslint.config.js` already covers `src/front/**/*.{ts,tsx}` with React rules. Don't add a per-workspace eslint config; just expose a `lint` script that delegates to the root config.
5. Root `tsconfig.base.json` has `verbatimModuleSyntax: true` — use `import type` for types and named imports for runtime values; default-importing React works because of `esModuleInterop`.
6. Pin Tailwind to v3 (`tailwindcss@^3.4`). The card's Plan B mentions v4 but v4's plugin model is different; staying on v3 keeps `npx tailwindcss init -p` valid.

---

## File Structure

Create under `src/front/`:

```
src/front/
├── .env.example
├── index.html
├── package.json            # MODIFY: replace placeholder scripts/deps
├── postcss.config.js       # CREATE (ESM; workspace is type:module)
├── tailwind.config.ts      # CREATE
├── tsconfig.json           # CREATE: extends ../../tsconfig.base.json
├── vite.config.ts          # CREATE
├── src/
│   ├── app/
│   │   └── App.tsx         # CREATE: <Routes> with "/" placeholder
│   ├── lib/
│   │   └── api.ts          # CREATE: setApiClient wiring
│   ├── test/
│   │   ├── setup.ts        # CREATE: jest-dom matchers
│   │   └── smoke.test.tsx  # CREATE: renders App, asserts text + tailwind class
│   ├── index.css           # CREATE: @tailwind directives
│   └── main.tsx            # CREATE: providers + render
```

The `src/lib/api.ts` import lives **before** any router import in `main.tsx` so `setApiClient` runs before components mount.

---

### Task 1: Pin dependencies in `src/front/package.json`

**Files:**
- Modify: `src/front/package.json`

- [ ] **Step 1: Open current contents to confirm baseline**

Run: `cat src/front/package.json`
Expected: shows placeholder scripts (`echo 'Setup completo virá no card de front'`) and the single `@foodloop/lib` dep.

- [ ] **Step 2: Replace file contents**

Write `src/front/package.json`:

```json
{
  "name": "@foodloop/front",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@foodloop/lib": "*",
    "@hookform/resolvers": "^3.9.0",
    "@tanstack/react-query": "^5.59.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-router-dom": "^6.27.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.3",
    "vite": "^5.4.8",
    "vitest": "^2.1.2"
  }
}
```

Note: `axios` is transitive through `@foodloop/lib` (the lib re-exports `AxiosInstance`); the front uses it only via `createApiClient`, so no direct dep needed.

- [ ] **Step 3: Install from repo root**

Run: `npm install`
Expected: `added N packages`, no `ERESOLVE`, no `peer dep` errors. If `peer dep` warnings appear, leave them — they're informational.

- [ ] **Step 4: Verify the workspace resolved**

Run: `ls src/front/node_modules/vite/bin/vite.js`
Expected: file exists.

- [ ] **Step 5: Commit**

```bash
git add src/front/package.json package-lock.json
git commit -m "chore(front): pin runtime + dev deps for setup"
```

---

### Task 2: TypeScript config for the front workspace

**Files:**
- Create: `src/front/tsconfig.json`

- [ ] **Step 1: Write the file**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "types": ["vite/client", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts", "tailwind.config.ts"]
}
```

- [ ] **Step 2: Sanity-check the base merges**

Run: `npx -w src/front tsc -p src/front/tsconfig.json --showConfig | head -40`
Expected: shows `"strict": true`, `"jsx": "react-jsx"`, `"lib"` includes `DOM`.

- [ ] **Step 3: Commit**

```bash
git add src/front/tsconfig.json
git commit -m "chore(front): tsconfig extending root base"
```

---

### Task 3: Vite + Tailwind + PostCSS wiring

**Files:**
- Create: `src/front/vite.config.ts`
- Create: `src/front/tailwind.config.ts`
- Create: `src/front/postcss.config.js`
- Create: `src/front/src/index.css`

- [ ] **Step 1: `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
});
```

`strictPort: true` makes the dev server fail loudly if 5173 is taken instead of silently shifting to 5174 — easier to debug.

- [ ] **Step 2: `tailwind.config.ts`**

Brand/accent/danger/ink/surface tokens come from the review-standards doc (section 12). Mirror them here:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
          600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
        accent: {
          500: '#f59e0b', 600: '#d97706',
        },
        danger: {
          500: '#ef4444', 600: '#dc2626',
        },
        ink: {
          500: '#6b7280', 700: '#374151', 900: '#111827',
        },
        surface: {
          50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

ESM because the workspace is `"type": "module"` and `postcss-load-config` (used by Vite) supports ESM configs natively. A `.cjs` file would trip root eslint's `no-undef` on `module`.

- [ ] **Step 4: `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Commit**

```bash
git add src/front/vite.config.ts src/front/tailwind.config.ts src/front/postcss.config.cjs src/front/src/index.css
git commit -m "chore(front): vite, tailwind, postcss config"
```

---

### Task 4: HTML entry + React render tree

**Files:**
- Create: `src/front/index.html`
- Create: `src/front/src/main.tsx`
- Create: `src/front/src/app/App.tsx`

- [ ] **Step 1: `index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>FoodLoop</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: `src/app/App.tsx`**

```tsx
import { Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <div className="min-h-screen bg-surface-50 text-ink-900">
      <Routes>
        <Route
          path="/"
          element={
            <main className="p-8">
              <h1 className="text-2xl font-semibold text-brand-700">FoodLoop</h1>
              <p className="mt-2 text-ink-500">Front em construção.</p>
            </main>
          }
        />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 3: `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './lib/api';
import { App } from './app/App';
import './index.css';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root ausente em index.html');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

Note: `./lib/api` is imported for its side effect (calls `setApiClient`) before `<App />` mounts.

- [ ] **Step 4: Commit**

```bash
git add src/front/index.html src/front/src/main.tsx src/front/src/app/App.tsx
git commit -m "feat(front): bootstrap React + Router + RQ providers"
```

---

### Task 5: Wire `@foodloop/lib` API client

**Files:**
- Create: `src/front/src/lib/api.ts`
- Modify: `src/lib` must be built so `dist/` exists

- [ ] **Step 1: Build the lib once**

Run: `npm run -w src/lib build`
Expected: exit 0; `src/lib/dist/index.d.ts` exists.

- [ ] **Step 2: Write `src/lib/api.ts`**

```ts
import { api as lib } from '@foodloop/lib';

export const apiClient = lib.createApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3010',
  getToken: () => localStorage.getItem('foodloop:token'),
  onUnauthorized: () => {
    localStorage.removeItem('foodloop:token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});

lib.setApiClient(apiClient);
```

Two refinements over the card text:
- `api` is the namespace export from `@foodloop/lib`, so we alias it as `lib` to make calls readable.
- The redirect guards against an infinite loop if `/login` itself ever 401s.

- [ ] **Step 3: Commit**

```bash
git add src/front/src/lib/api.ts
git commit -m "feat(front): initialise @foodloop/lib api client"
```

---

### Task 6: Test harness + smoke test (TDD checkpoint)

**Files:**
- Create: `src/front/src/test/setup.ts`
- Create: `src/front/src/test/smoke.test.tsx`

- [ ] **Step 1: `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 2: Write the failing smoke test**

Create `src/front/src/test/smoke.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { App } from '../app/App';

describe('App shell', () => {
  it('renders the placeholder heading on /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const heading = screen.getByRole('heading', { name: /foodloop/i });
    expect(heading).toBeInTheDocument();
    expect(heading.className).toMatch(/text-brand-700/);
  });

  it('imports @foodloop/lib without throwing', async () => {
    const mod = await import('@foodloop/lib');
    expect(typeof mod.api.createApiClient).toBe('function');
  });
});
```

The class-name assertion is structural (not visual) — it proves the Tailwind class survived our JSX, which is the only thing a unit test can prove. Verifying the class actually paints green is a manual `npm run -w src/front dev` check in Task 8.

- [ ] **Step 3: Run the test — it should pass already**

Run: `npm run -w src/front test`
Expected: 2 passed. If the test fails because `react-router-dom` complains about nested routers, you wrapped `<App />` in `<BrowserRouter>` somewhere; the App component itself must not contain a Router.

- [ ] **Step 4: Commit**

```bash
git add src/front/src/test/setup.ts src/front/src/test/smoke.test.tsx
git commit -m "test(front): smoke test for app shell + lib import"
```

---

### Task 7: Environment example

**Files:**
- Create: `src/front/.env.example`

- [ ] **Step 1: Write the file**

```
VITE_API_URL=http://localhost:3010
VITE_USE_MSW=false
```

`VITE_USE_MSW=false` because MSW lands in a later card; the variable is declared now so consumers know it exists.

- [ ] **Step 2: Commit**

```bash
git add src/front/.env.example
git commit -m "chore(front): env example pointing at backend port 3010"
```

---

### Task 8: Acceptance gate — every script green + manual smoke

- [ ] **Step 1: Typecheck**

Run: `npm run -w src/front typecheck`
Expected: exit 0, no diagnostic output.

- [ ] **Step 2: Lint**

Run: `npm run -w src/front lint`
Expected: exit 0.

Common gotcha: if it complains about `'React' is defined but never used` in `main.tsx`, the root `eslint-plugin-react/jsx-uses-react` rule didn't catch it because of the React 17+ runtime — keep the `import React from 'react'` (we need `React.StrictMode`) and the rule won't fire.

- [ ] **Step 3: Test**

Run: `npm run -w src/front test`
Expected: 2 passed.

- [ ] **Step 4: Build**

Run: `npm run -w src/front build`
Expected: exit 0; `src/front/dist/index.html` produced.

- [ ] **Step 5: Dev server smoke (manual)**

Run: `npm run -w src/front dev`
Open: `http://localhost:5173`
Expected: page shows "FoodLoop" heading in brand-700 green and "Front em construção." in muted ink-500 grey on a near-white surface-50 background. Stop the server with Ctrl-C.

- [ ] **Step 6: Lib import smoke (manual)**

Open the running dev server's devtools console and run:

```js
const m = await import('/src/lib/api.ts');
console.log(typeof m.apiClient.get);
```

Expected: `"function"`.

- [ ] **Step 7: Commit any final adjustments**

If any step required tweaks, commit them under a focused message; otherwise skip.

```bash
git status
# if dirty:
git add -p
git commit -m "fix(front): <what>"
```

---

### Task 9: Open the PR

- [ ] **Step 1: Push the branch**

Run: `git push -u origin worktree-feat+front-setup:feat/front-setup`

Note the `local:remote` ref — the worktree's local branch is `worktree-feat+front-setup` but we publish it as `feat/front-setup` to match the repo's naming convention. **STOP HERE and confirm with the maintainer before pushing** — repo policy requires explicit approval for branch publication.

- [ ] **Step 2: After approval, open the PR**

Title: `feat(front): setup Vite + React + Tailwind + RQ + Zustand`

Body checklist (paste into PR description):

```
- [x] `npm run -w src/front dev` serves placeholder at localhost:5173
- [x] `npm run -w src/front build` exit 0
- [x] `npm run -w src/front typecheck` exit 0
- [x] `npm run -w src/front lint` exit 0
- [x] Tailwind tokens apply (`text-brand-700`, `bg-surface-50`)
- [x] `@foodloop/lib` imports without error
- [x] Diff < 400 LOC
```

---

## Out of scope (do not add)

- MSW handlers — separate card.
- Auth screens (`/login`, `/cadastro`) — separate cards.
- Auth store — separate card.
- PWA manifest / service worker — post-MVP.
- Any back-end change — this PR touches only `src/front/` plus a one-line rebuild of `src/lib/dist/`.

## If something breaks

- **`tsc` says `Cannot find module '@foodloop/lib'`** → run `npm run -w src/lib build` and retry.
- **`vite dev` exits with `EADDRINUSE`** → `lsof -i :5173`, kill the squatter, retry. `strictPort` is intentional.
- **Tailwind classes don't apply** → check `tailwind.config.ts` `content` globs and that `index.css` is imported in `main.tsx`.
- **`postcss` complains about ESM config** → confirm the file is `postcss.config.js` with `export default`, not `.ts` or `.cjs`.
- **`@foodloop/lib` import succeeds in tests but fails in dev** → the lib hasn't been rebuilt since its last source change; `npm run -w src/lib build`.
