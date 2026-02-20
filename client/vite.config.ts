import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/features/**/*.ts', 'src/features/**/*.tsx', 'src/shared/**/*.ts', 'src/shared/**/*.tsx'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/components/ui/**',
        '**/*.d.ts',
        'postcss.config.js',
        'tailwind.config.js',
        'eslint.config.js',
        'src/setupTests.ts'
      ],
    },
  },
})
