import { dest_api, dest_img } from './target_config'

// Команда RISC-V из ответа API (поля совпадают с JSON бэкенда)
export interface Command {
  id: number
  mnemonic: string
  description: string
  description_en?: string
  operand_count: number
  length_bits: number
  image_url: string
  like_count: number
}

// Количество карточек на странице пагинации (limit метода GET /api/riscv_commands)
export const PAGE_LIMIT = 12

// Страница списка команд: GET /api/riscv_commands
export interface CommandPage {
  total: number
  data: Command[]
}

// Ссылки на изображения приходят с адресом MinIO для браузера (localhost) или относительными:
// в Tauri они заменяются на адрес ноутбука в локальной сети
export const mediaUrl = (url: string): string => {
  if (!url) return `${dest_api}/defaults/image.svg`
  if (url.startsWith('/')) return dest_api + url
  const { pathname } = new URL(url)
  return dest_img + pathname
}

// Плагин cors-fetch не передаёт ошибку Rust в fetch: запрос просто не завершается, а ошибка попадает в
// unhandledrejection. Последняя такая причина добавляется к сообщению для диагностики сети.
let lastRejection = ''
window.addEventListener('unhandledrejection', (event) => {
  lastRejection = String(event.reason)
})

// Запрос к бэкенду с ограничением времени: при недоступном адресе пользователь видит ошибку, а не бесконечную загрузку
const request = async (url: string): Promise<Response> => {
  lastRejection = ''
  try {
    return await fetch(url, { signal: AbortSignal.timeout(10000) })
  } catch {
    const reason = lastRejection ? ` Причина: ${lastRejection}` : ''
    throw new Error(`Нет связи с бэкендом (${dest_api || 'прокси Vite'}). Проверьте сеть ZeroTier и запущенный backend.${reason}`)
  }
}

// Фильтрация и пагинация выполняются на бэкенде: загружается одна страница списка
export const getCommands = async (minOperands: number, maxOperands: number, page: number): Promise<CommandPage> => {
  const query = new URLSearchParams({
    min_operands: String(minOperands),
    max_operands: String(maxOperands),
    page: String(page),
    limit: String(PAGE_LIMIT),
  })
  const response = await request(`${dest_api}/api/riscv_commands?${query}`)
  if (!response.ok) throw new Error('Не удалось загрузить список команд.')
  return response.json()
}

// Изображение по умолчанию, если объект в MinIO недоступен
export const defaultImage = (): string => `${dest_api}/defaults/image.svg`

// Подробнее: лента без next возвращает указанную опубликованную команду
export const getCommand = async (id: number): Promise<Command> => {
  const response = await request(`${dest_api}/api/riscv_commands/feed?${new URLSearchParams({ id: String(id) })}`)
  if (response.status === 404) throw new Error('Команда не найдена.')
  if (!response.ok) throw new Error('Не удалось загрузить команду.')
  return response.json()
}
