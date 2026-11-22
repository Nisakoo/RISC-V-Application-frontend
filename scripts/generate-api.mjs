import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateApi } from 'swagger-typescript-api'

// Скрипт лежит в frontend/scripts, поэтому корень фронтенда — на уровень выше
const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Сохранённая спецификация нужна, если backend не запущен
const swaggerFile = resolve(frontendRoot, '../backend/docs/swagger/swagger.json')
const swaggerUrl = process.env.SWAGGER_URL ?? 'http://localhost:8080/swagger/doc.json'

const options = {
  name: 'Api.ts',
  output: resolve(frontendRoot, './src/api'),
  httpClientType: 'axios',
  generateClient: true,
  generateRouteTypes: false,
}

try {
  // Основной источник — живая спецификация backend
  await generateApi({ ...options, url: swaggerUrl })
} catch (error) {
  console.warn(`Не удалось получить Swagger по ${swaggerUrl}, используется сохранённый файл.`)
  await generateApi({ ...options, input: swaggerFile })
}
