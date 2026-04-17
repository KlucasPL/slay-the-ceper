import { defineConfig } from 'vite';

export default defineConfig({
  base: '/slay-the-ceper/',
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/state/**/*.js', 'src/data/**/*.js'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
