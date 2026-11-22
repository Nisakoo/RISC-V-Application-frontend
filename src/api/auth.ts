import type { HandlerApiAuthentication } from './Api'
import { http } from './http'

// Авторизация и деавторизация выполняются только через axios, без кодогенерации и thunk;
// состояние Redux после них меняется вручную обычными actions
export const signIn = async (login: string, password: string): Promise<HandlerApiAuthentication> => {
  const response = await http.post<HandlerApiAuthentication>('/api/users/authentication', {
    login,
    password,
  })
  return response.data
}

export const signOut = (): Promise<unknown> => http.post('/api/users/logout')
