import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import _import from 'eslint-plugin-import';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  { ignores: ['**/dist', '**/storybook-static'] },
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:prettier/recommended',
      'plugin:import/typescript',
      'plugin:react-hooks/recommended',
      'plugin:storybook/recommended',
      'plugin:@typescript-eslint/recommended',
    ),
  ),
  {
    plugins: { import: fixupPluginRules(_import), 'react-refresh': reactRefresh },
    languageOptions: { globals: { ...globals.browser }, parser: tsParser },
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
      'import/order': 'error',
      'import/no-duplicates': 'error',
      'sort-imports': ['error', { ignoreDeclarationSort: true }],
      'no-duplicate-imports': 'error',
      'no-use-before-define': 'error',
      'no-useless-rename': 'error',
      'no-useless-concat': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-spread': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      'no-console': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
