import { FC } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  heading: string
  message: string
  actionURL: string
  actionLabel: string
}

// Сообщение об ошибке страницы, как error.html в SSR-интерфейсе backend
export const StatusMessage: FC<Props> = ({ heading, message, actionURL, actionLabel }) => (
  <main className="page-view plain-page status-page" role="alert">
    <h1>{heading}</h1>
    <p>{message}</p>
    <Link className="button primary-action" to={actionURL}>
      {actionLabel}
    </Link>
  </main>
)
