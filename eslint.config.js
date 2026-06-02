// ESLint flat config (v9+).
// Documenta as regras gerais e mantém as restrições de portabilidade da @foodloop/lib.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/build/**', '**/coverage/**', '**/node_modules/**', 'src/front/public/**'] },

  // Base JS + TS
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Defaults para todo TS do repo
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },

  // Front-end (React)
  {
    files: ['src/front/**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+ não precisa
      'react/prop-types': 'off', // TS cobre
    },
  },

  // src/lib: portavel. Sem React, sem Node-only, sem Express.
  // Esta regra é load-bearing: mantém o pacote utilizável tanto no back quanto no front
  // (e amanhã num cliente mobile via Capacitor / React Native).
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'fs', message: 'src/lib é portável: sem APIs Node' },
            { name: 'node:fs', message: 'src/lib é portável: sem APIs Node' },
            { name: 'path', message: 'src/lib é portável: sem APIs Node' },
            { name: 'node:path', message: 'src/lib é portável: sem APIs Node' },
            { name: 'react', message: 'src/lib é portável: sem React' },
            { name: 'react-dom', message: 'src/lib é portável: sem React DOM' },
            { name: 'express', message: 'src/lib é portável: sem Express' },
          ],
          patterns: ['react-dom*', 'react-native*'],
        },
      ],
    },
  },

  // Testes podem afrouxar
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  prettier,
);
