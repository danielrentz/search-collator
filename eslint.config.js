import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import vitest from '@vitest/eslint-plugin'

export default defineConfig([
  { ignores: ['dist/', 'output/'] },
  {
    linterOptions: {
      // report unused inline linter directives in source code
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
  },
  {
    files: ['**/*.{js,ts}'],
    extends: [js.configs.recommended],
    rules: {
      eqeqeq: 'error',
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-invalid-void-type': ['error', {
        allowAsThisParameter: true,
        allowInGenericTypeArguments: true,
      }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        caughtErrors: 'all',
        ignoreRestSiblings: true,
      }],
      '@typescript-eslint/restrict-template-expressions': ['error', {
        allowBoolean: true,
        allowNullish: true,
        allowNumber: true,
      }],
    },
  },
  {
    extends: [stylistic.configs.recommended],
    rules: {
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
    },
  },
  {
    files: ['test/**.test.*'],
    extends: [vitest.configs.recommended],
    rules: {
      'vitest/expect-expect': ['error', { assertFunctionNames: ['expect*'] }],
    },
  },
])
