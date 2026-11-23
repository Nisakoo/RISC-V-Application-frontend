import { FC } from 'react'
import { Outlet } from 'react-router-dom'

import { BottomNavigation } from './components/BottomNavigation'
import { LoadingIndicator } from './components/LoadingIndicator'
import { useAppSelector } from './hooks/store'

// Общая оболочка: вертикальный экран телефона и нижняя навигация, которая
// не пересоздаётся при переходах между страницами
export const AppLayout: FC = () => {
  // Любой запрос к API команд, вход и выход блокируют интерфейс анимацией загрузки
  const isBusy = useAppSelector(
    ({ riscvCommands, draft, user, feedBatch }) =>
      feedBatch.status === 'loading' ||
      riscvCommands.listLoading ||
      riscvCommands.feedLoading ||
      riscvCommands.likePending ||
      riscvCommands.deletingId !== null ||
      draft.loading ||
      user.pending,
  )

  return (
    <div className="phone">
      <Outlet />
      <BottomNavigation />
      {isBusy && <LoadingIndicator overlay />}
    </div>
  )
}
