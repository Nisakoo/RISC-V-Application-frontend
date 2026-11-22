import axios from 'axios'

interface ApiErrorBody {
  message?: string
}

// Достаёт понятное сообщение backend из ответа axios, не показывая внутренние ошибки
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback

  const body = error.response?.data as ApiErrorBody | undefined
  if (body?.message) return body.message

  if (!error.response) return 'Не удалось связаться с сервером. Попробуйте позже.'
  if (error.response.status === 401) return 'Требуется авторизация.'
  if (error.response.status === 403) return 'Недостаточно прав для этого действия.'
  if (error.response.status === 404) return 'Запрашиваемые данные не найдены.'
  return fallback
}

export const isApiStatus = (error: unknown, status: number): boolean =>
  axios.isAxiosError(error) && error.response?.status === status

// Сборка для GitHub Pages (VITE_MOCK_ONLY=true): backend там нет, а сам хостинг отвечает 404
// на любой запрос к /api, поэтому такой ответ тоже считается недоступностью backend
const MOCK_ONLY = import.meta.env.VITE_MOCK_ONLY === 'true'

// Сервер не ответил (сеть, прокси, остановленный backend): только тогда гость получает mock
export const isBackendUnavailable = (error: unknown): boolean =>
  MOCK_ONLY || !(axios.isAxiosError(error) && error.response)
