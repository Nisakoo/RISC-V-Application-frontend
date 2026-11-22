import { Api } from './Api'
import { getAccessToken } from '../modules/authStorage'

// Единственный axios-инстанс приложения принадлежит сгенерированному клиенту.
// JWT берётся из localStorage при каждом запросе, поэтому одни и те же методы
// работают и для гостя, и для авторизованного пользователя.
// Для FormData Content-Type с boundary выставляет сам axios в браузере.
export const client = new Api({ baseURL: '/' })

client.instance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Наружу отдаём только методы API, чтобы в слайсах не было двойного api.api
export const api = client.api
