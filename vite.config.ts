/// <reference types="vitest/config" />
import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Для GitHub Pages приложение лежит в подкаталоге репозитория (VITE_BASE=/RISC-V-Application-frontend/),
// локально и в dev-режиме базовый путь остаётся корневым
const base = process.env.VITE_BASE || '/'

// vite-plugin-mkcert не подключён: он вызывает Go-версию mkcert (-CAROOT) и падает на npm-версии
// из методички. HTTPS настраивается файлами cert.key и cert.crt через server.https.
// Ключи и сертификат создаются командами mkcert create-ca и mkcert create-cert
// и не хранятся в Git (см. docs/pwa-demonstration.md)

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Service worker и manifest доступны и в dev-режиме
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Команды RISC-V',
        short_name: 'RISC-V',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#fafafa',
        theme_color: '#f3bf4f',
        orientation: 'portrait-primary',
        icons: [
          { src: 'logo192.png', type: 'image/png', sizes: '192x192' },
          { src: 'logo512.png', type: 'image/png', sizes: '512x512' },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
    // Доступ с телефона по IP-адресу ноутбука в локальной сети
    host: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert.crt')),
    },
    proxy: {
      // Запросы к API идут через Vite (реверс-прокси), поэтому браузер не делает CORS-запросы
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
