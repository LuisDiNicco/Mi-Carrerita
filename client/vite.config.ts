import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'vite.svg'],
      manifest: {
        name: 'Mi Carrerita',
        short_name: 'MiCarrerita',
        description: 'Gestiona tu carrera universitaria',
        theme_color: '#10B981',
        background_color: '#1A1A1A',
        display: 'standalone',
        icons: [
          { src: 'vite.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'vite.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ],
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
