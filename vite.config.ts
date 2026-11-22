/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      // Запросы к API идут через Vite, поэтому браузер не делает CORS-запросы
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Второй маршрут прокси нужен для изображений и видео из MinIO
      '/riscv-assets': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
