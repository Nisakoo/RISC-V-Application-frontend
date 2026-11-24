// Адреса бэкенда и MinIO. В Tauri-сборке нет сервера Vite с прокси, поэтому запросы идут напрямую
// по IP ноутбука в виртуальной сети ZeroTier One (не localhost): адрес не меняется при смене Wi-Fi.
// Узнать IP: zerotier-cli listnetworks (колонка с адресом). Тот же адрес указан в src-tauri/tauri.conf.json
// (CSP) и src-tauri/capabilities/default.json.
export const lan_host = '10.227.163.200'

export const api_proxy_addr = `http://${lan_host}:8080`
export const img_proxy_addr = `http://${lan_host}:9000`

// Приложение запущено внутри окна Tauri (а не во вкладке браузера при npm run dev)
export const target_tauri = '__TAURI_INTERNALS__' in window

// В браузере запросы идут на тот же адрес, а прокси Vite (vite.config.ts) перенаправляет их на бэкенд
export const dest_api = target_tauri ? api_proxy_addr : ''
export const dest_img = target_tauri ? img_proxy_addr : ''
