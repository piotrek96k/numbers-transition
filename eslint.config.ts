import type { RulesConfig } from '@eslint/core';
import js from '@eslint/js';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const rules: RulesConfig = {
  '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends', allowWithName: 'BaseObject' }],
  '@typescript-eslint/no-explicit-any': 'off',
  'no-console': 'warn',
  'no-duplicate-imports': 'error',
  'no-use-before-define': ['error', { classes: false }],
  'no-useless-concat': 'error',
  'no-useless-rename': 'error',
  'object-shorthand': 'error',
  'perfectionist/sort-imports': ['error', { type: 'alphabetical', order: 'asc', newlinesBetween: 'ignore' }],
  'prefer-spread': 'error',
  'prefer-template': 'error',
  'react-hooks/refs': 'off',
  'react-hooks/set-state-in-effect': 'off',
  'sort-imports': ['error', { ignoreDeclarationSort: true }],
};

const config: Parameters<typeof defineConfig> = [
  globalIgnores(['dist', 'plugins/dist', 'storybook-static']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      eslintPluginPrettierRecommended,
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      tseslint.configs.recommended,
    ],
    languageOptions: { globals: globals.browser },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    plugins: { perfectionist },
    rules,
  },
];

export default defineConfig(config);
