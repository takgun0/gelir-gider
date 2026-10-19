import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'coverage', 'project']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      // Alan atmak için yapılan yıkımlarda (`const { period: _p, ...rest }`) "_" öneki.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      // SPEC §5.7: kullanıcı girdisi yalnızca metin düğümü olarak basılır.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'SPEC §5.7: innerHTML kullanılmaz.' },
        { property: 'outerHTML', message: 'SPEC §5.7: outerHTML kullanılmaz.' },
        { object: 'Date', property: 'parse', message: 'SPEC §5.2: Date.parse yasak; src/domain/date.ts kullan.' },
        { property: 'toISOString', message: 'SPEC §5.2: tarih string\'i src/domain/date.ts ile üretilir.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'SPEC §5.7: dangerouslySetInnerHTML kullanılmaz.',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=1][arguments.0.type='Literal']",
          message: "SPEC §5.2: new Date('YYYY-MM-DD') yasak; new Date(y, m - 1, d) kullan.",
        },
      ],
    },
  },
  {
    // Context modülleri sağlayıcıyla birlikte hook da dışa aktarır; HMR bu dosyalarda tam yenileme yapar.
    files: ['src/app/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['scripts/**/*.mjs', 'public/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
]);
