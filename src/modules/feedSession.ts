// Идентификатор сессии ленты хранится в sessionStorage: после F5 лента продолжается
// с той же порцией и той же нумерацией, а в новой вкладке начинается новая сессия
const FEED_SESSION_KEY = 'riscv.feed_session'

export const getFeedSession = (): string => {
  try {
    return sessionStorage.getItem(FEED_SESSION_KEY) ?? ''
  } catch {
    return ''
  }
}

export const setFeedSession = (sessionId: string): void => {
  try {
    sessionStorage.setItem(FEED_SESSION_KEY, sessionId)
  } catch {
    // Хранилище недоступно: сессия живёт только в Redux
  }
}
