import { FC, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { RiscVCommandFeedView } from '../components/RiscVCommandFeedView'
import { StatusMessage } from '../components/StatusMessage'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import {
  RiscVCommandError,
  RiscVCommandFeed,
  getRiscVCommandFeed,
} from '../modules/riscvCommandsApi'
import { ROUTES } from '../Routes'

type FeedState =
  | { status: 'loading' }
  | { status: 'ready'; feed: RiscVCommandFeed }
  | { status: 'error'; heading: string; message: string }

// Страница ленты: /riscv_commands/feed?id=<id>, без id открывается первая команда
export const RiscVCommandsFeedPage: FC = () => {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const [state, setState] = useState<FeedState>({ status: 'loading' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Ответ для устаревшего id игнорируется, если пользователь уже перешёл дальше
    let isActual = true
    setIsLoading(true)
    getRiscVCommandFeed(id)
      .then((feed) => isActual && setState({ status: 'ready', feed }))
      .catch((error: unknown) => {
        if (!isActual) return
        const { heading, message } =
          error instanceof RiscVCommandError
            ? error
            : { heading: 'Ошибка', message: 'Не удалось загрузить команду.' }
        setState({ status: 'error', heading, message })
      })
      .finally(() => isActual && setIsLoading(false))
    return () => {
      isActual = false
    }
  }, [id])

  useDocumentTitle(
    state.status === 'ready' ? `${state.feed.riscv_command.mnemonic} · RISC-V` : 'Лента · RISC-V',
  )

  if (state.status === 'error' && !isLoading) {
    return (
      <StatusMessage
        heading={state.heading}
        message={state.message}
        actionURL={ROUTES.FEED}
        actionLabel="Открыть ленту"
      />
    )
  }

  return (
    <main className="page-view feed-page">
      {state.status === 'ready' && (
        <RiscVCommandFeedView
          key={state.feed.riscv_command.id}
          riscvCommand={state.feed.riscv_command}
          nextId={state.feed.next_id}
        />
      )}
      {isLoading && <LoadingIndicator overlay />}
    </main>
  )
}
