// @ts-check
import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const RELATIVE_IMPORT_PATTERN = {
  group: ['./*', '../*'],
  message:
    'Import using a path relative to the project root (e.g. "src/foo/bar") instead of a relative import.',
}

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^node:'],
            ['^@\\w'],
            ['^(?!src/|test/)\\w'],
            ['^src/'],
            ['^test/'],
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [RELATIVE_IMPORT_PATTERN],
        },
      ],
    },
  },
  // Last, so it switches off every stylistic rule prettier owns. Formatting is
  // checked by `npm run format:check`, a separate CI step — ESLint passes code
  // that prettier fails.
  prettier,
)
