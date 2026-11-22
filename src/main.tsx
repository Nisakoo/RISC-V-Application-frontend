import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'bootstrap/dist/css/bootstrap.min.css'
// Стили приложения подключаются после Bootstrap и переопределяют его
import './styles/app.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import { store } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)

// Service worker нужен для работы в режиме PWA (требует HTTPS или localhost)
if ('serviceWorker' in navigator) {
  registerSW()
}
