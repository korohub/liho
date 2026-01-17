import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['scripts/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/_generated/**']
    }
  }
})
