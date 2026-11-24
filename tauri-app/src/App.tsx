import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { CommandDetailPage } from './pages/CommandDetailPage'
import { CommandListPage } from './pages/CommandListPage'

// Две страницы гостя: список команд и «Подробнее».
// HashRouter не требует сервера: в собранном приложении Tauri страницы отдаются из файлов.
export default function App() {
  return (
    <HashRouter>
      <div className="phone">
        <Routes>
          <Route path="/" element={<CommandListPage />} />
          <Route path="/commands/:id" element={<CommandDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
