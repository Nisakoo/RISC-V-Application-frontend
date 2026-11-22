# ЛР7: адаптивность, PWA, GitHub Pages и HTTPS

## Что реализовано

| Часть задания | Где | Как |
| --- | --- | --- |
| Адаптивность | `src/styles/app.css` | Медиазапросы меняют ширину приложения и число колонок плитки |
| PWA | `vite.config.ts`, `src/main.tsx`, `public/logo*.png` | `vite-plugin-pwa`: manifest и service worker, `registerSW()` |
| GitHub Pages | `package.json`, `vite.config.ts`, `src/App.tsx` | `gh-pages`, `base` Vite и `basename` в `BrowserRouter` |
| HTTPS | `vite.config.ts`, файлы `cert.*` | `server.https` на сертификате `mkcert`; Vite служит реверс-прокси `/api` и `/riscv-assets` |
| Фильтр при возврате | `src/pages/RiscVCommandsGridPage.tsx` | Фильтр из Redux восстанавливается в URL при открытии плитки без параметров |

## Значения адаптивности (`src/styles/app.css`)

| Ширина окна | Режим | Ширина приложения `--app-max-width` | Колонок плитки `--grid-columns` | Отступ `--grid-gap` |
| --- | --- | --- | --- | --- |
| до 359px | узкий телефон | 100% (не более 440px) | 1 | 12px |
| 360–575px | телефон | 440px | 2 | 12px |
| 576–991px | планшет | 720px | 3 | 16px |
| от 992px | десктоп | 960px | 4 | 20px |

Нижняя навигация из четырёх пунктов остаётся на всех ширинах. На ширине от 576px видео ленты не обрезается
(`object-fit: contain`), а формы входа и добавления ограничены 520px.

## Сертификаты и HTTPS (по методичке)

```bash
npm install -g mkcert
cd frontend
mkcert create-ca
mkcert create-cert
```

Команда создаёт `ca.crt`, `ca.key`, `cert.crt`, `cert.key`. Все четыре файла перечислены в `.gitignore`
и в Git не попадают; приватные ключи нельзя публиковать.

Отличие от методички одно: `vite-plugin-mkcert` установлен, но в `plugins` не подключён. Плагин вызывает Go-версию
`mkcert -CAROOT` и падает, когда в `PATH` лежит npm-версия из методички. HTTPS включается блоком `server.https`
с `cert.key` и `cert.crt`. Без файлов сертификата `vite` не запустится.

Браузер доверяет сертификату только после установки `ca.crt` в доверенные; методичка этот шаг не описывает.

## Запуск

```bash
make lab7-run
```

Приложение открывается на `https://localhost:3000` и на телефоне на `https://<IP ноутбука>:3000`. Vite слушает
все интерфейсы (`server.host: true`). Проверка PWA: DevTools → Application → Manifest и Service Workers.

## GitHub Pages

```bash
cd frontend
npm run build:pages   # VITE_BASE=/RISC-V-Application-frontend/ VITE_MOCK_ONLY=true npm run build
npm run deploy        # gh-pages -d dist
```

Приложение появится на `https://<пользователь GitHub>.github.io/RISC-V-Application-frontend/`.
На Pages нет бэкенда, а хостинг отвечает 404 на любой запрос к `/api`. Без особого режима слайс счёл бы это ошибкой backend и не показал бы mock, поэтому сборка для Pages выполняется с `VITE_MOCK_ONLY=true`: гость всегда получает mock-команды.

## Порядок проверки

1. Скриншоты 1–2: открыть адрес Pages на телефоне и добавить приложение на главный экран.
2. Скриншоты 3–6: в PWA выставить фильтр на плитке, открыть команду (лента) и вернуться через «Плитка»: фильтр сохранён.
3. Скриншот 7: DevTools → адаптивный режим, менять ширину; колонок 1 → 2 → 3 → 4.
4. Скриншоты 8–12: на телефоне открыть `https://<IP ноутбука>:3000`, войти и показать три страницы с данными бэкенда.
5. Скриншоты 13–14: сертификат в браузере и блок `server.https` в `vite.config.ts`.
6. Скриншоты 15–17: значения из таблицы выше в `app.css` (`--app-max-width`, `--grid-columns`, `--grid-gap`).
