import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Адреса прокси для режима npm run dev во вкладке браузера; в Tauri-сборке прокси нет,
// адреса задаёт src/target_config.ts
export default defineConfig({
  plugins: [react()],
  // Фиксированный порт: его же указывает devUrl в src-tauri/tauri.conf.json
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/defaults': { target: 'http://localhost:8080', changeOrigin: true },
      // Изображения команд лежат в MinIO
      '/riscv-assets': { target: 'http://localhost:9000', changeOrigin: true },
    },
  },
  // transformers.js не нужно собирать заранее: воркер подгружает модель сам
  optimizeDeps: { exclude: ['@huggingface/transformers'] },
  worker: { format: 'es' },
})
