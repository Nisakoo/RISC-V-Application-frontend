// Ключ токена совпадает с полем ответа backend, чтобы значение было понятно на вкладке Application
const ACCESS_TOKEN_KEY = 'access_token'

// Признак активной сессии живёт только в памяти вкладки.
// После F5 Redux сбрасывается в состояние гостя, поэтому старый JWT
// остаётся в localStorage для показа, но автоматически не используется в запросах.
let sessionActive = false

export const getAccessToken = (): string =>
  sessionActive ? (localStorage.getItem(ACCESS_TOKEN_KEY) ?? '') : ''

export const setAccessToken = (token: string): void => {
  sessionActive = true
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const clearAccessToken = (): void => {
  sessionActive = false
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}
