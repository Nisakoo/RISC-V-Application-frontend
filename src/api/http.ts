import { client } from './index'

// Вход и выход выполняются напрямую через axios без кодогенерации и thunk;
// используется тот же инстанс, что и у сгенерированного клиента
export const http = client.instance
