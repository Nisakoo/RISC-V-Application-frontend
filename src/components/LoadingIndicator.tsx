import { FC } from 'react'
import { Spinner } from 'react-bootstrap'

interface Props {
  // Поверх страницы (лента) или в потоке страницы (плитка)
  overlay?: boolean
}

// Индикатор загрузки данных команд RISC-V
export const LoadingIndicator: FC<Props> = ({ overlay = false }) => (
  <div className={`loading-indicator${overlay ? ' loading-indicator--overlay' : ''}`}>
    <Spinner animation="border" role="status">
      <span className="visually-hidden">Загрузка команд RISC-V</span>
    </Spinner>
  </div>
)
