import { FC } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNavigation } from './components/BottomNavigation'

// Общая оболочка: вертикальный экран телефона и нижняя навигация, которая
// не пересоздаётся при переходах между страницами
export const AppLayout: FC = () => (
  <div className="phone">
    <Outlet />
    <BottomNavigation />
  </div>
)
