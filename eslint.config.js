import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['src/rpc/**/*.js', 'scripts/rpc-server.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: [
      'tests/**/*.js',
      'vite.config.js',
      'eslint.config.js',
      'scripts/**/*.js',
      'bench/**/*.js',
      'playwright.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['tests/e2e/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ['tools/dashboard/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    ignores: ['tools/dashboard/vendor/**'],
  },
  {
    files: ['src/state/**/*.js', 'src/data/**/*.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.object.name="Math"][callee.property.name="random"]',
          message: 'Use state.rng() instead of Math.random() in src/state/ and src/data/.',
        },
      ],
    },
  },
];
