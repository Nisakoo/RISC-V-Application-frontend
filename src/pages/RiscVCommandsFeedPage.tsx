import { FC, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { RiscVCommandFeedView } from '../components/RiscVCommandFeedView'
import { StatusMessage } from '../components/StatusMessage'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAppDispatch, useAppSelector } from '../hooks/store'
import { fetchFeed, setLike } from '../slices/riscvCommandsSlice'
import { ROUTES } from '../Routes'

// Страница ленты: /riscv_commands/feed?id=<id>, без id открывается первая команда
export const RiscVCommandsFeedPage: FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const idParameter = searchParams.get('id')
  const isInvalidId = idParameter !== null && !/^[1-9]\d*$/.test(idParameter)
  const id = idParameter !== null && !isInvalidId ? Number(idParameter) : null

  const { feed, feedLoading, feedError, likeError, likePending } = useAppSelector(
    (state) => state.riscvCommands,
  )
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)

  useEffect(() => {
    if (!isInvalidId) {
      dispatch(fetchFeed({ id }))
    }
  }, [dispatch, id, isInvalidId, isAuthenticated])

  useDocumentTitle(feed ? `${feed.riscv_command.mnemonic} · RISC-V` : 'Лента · RISC-V')

  const handleLike = () => {
    if (!feed) return
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN)
      return
    }
    dispatch(
      setLike({
        id: feed.riscv_command.id,
        like: feed.is_liked === 1 ? 0 : 1,
      }),
    )
  }

  if (isInvalidId) {
    return (
      <StatusMessage
        heading="Некорректный идентификатор"
        message="Идентификатор команды должен быть положительным числом."
        actionURL={ROUTES.FEED}
        actionLabel="Открыть ленту"
      />
    )
  }

  if (feedError && !feedLoading) {
    return (
      <StatusMessage
        heading="Команда не найдена"
        message={feedError}
        actionURL={ROUTES.FEED}
        actionLabel="Открыть ленту"
      />
    )
  }

  return (
    <main className="page-view feed-page">
      {feed && (
        <>
          {likeError && (
            <p className="feed-error" role="alert">
              {likeError}
            </p>
          )}
          <RiscVCommandFeedView
            key={feed.riscv_command.id}
            riscvCommand={feed.riscv_command}
            nextId={feed.next_id}
            isLiked={feed.is_liked === 1}
            isAuthenticated={isAuthenticated}
            likePending={likePending}
            onLike={handleLike}
          />
        </>
      )}
    </main>
  )
}
