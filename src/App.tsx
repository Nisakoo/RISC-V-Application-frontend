import { FC } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RiscVCommandAddPage } from './pages/RiscVCommandAddPage'
import { RiscVCommandsFeedPage } from './pages/RiscVCommandsFeedPage'
import { RiscVCommandsGridPage } from './pages/RiscVCommandsGridPage'
import { ROUTES } from './Routes'

// Маршруты отделены от BrowserRouter, чтобы в тестах использовать MemoryRouter
export const AppRoutes: FC = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path={ROUTES.FEED} element={<RiscVCommandsFeedPage />} />
      <Route path={ROUTES.GRID} element={<RiscVCommandsGridPage />} />
      <Route path={ROUTES.ADD} element={<RiscVCommandAddPage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path="*" element={<Navigate to={ROUTES.FEED} replace />} />
    </Route>
  </Routes>
)

const App: FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
)

export default App
