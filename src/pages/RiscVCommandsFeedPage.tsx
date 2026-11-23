import { FC, MouseEvent, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { RiscVCommandFeedView } from '../components/RiscVCommandFeedView'
import { StatusMessage } from '../components/StatusMessage'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAppDispatch, useAppSelector } from '../hooks/store'
import { fetchFeedBatch } from '../slices/feedBatchSlice'
import { fetchFeed, setLike } from '../slices/riscvCommandsSlice'
import { ROUTES } from '../Routes'

// Страница ленты: /riscv_commands/feed?id=<id>.
// Команды берутся из порции в Redux (до 100 случайных команд сессии из Redis); «Следующий» идёт по ней
// без запросов, а после последней команды загружается новая порция. Если порции нет
// (backend недоступен) или id не входит в неё, работает прежняя лента по id с mock-данными гостя.
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
  const batch = useAppSelector((state) => state.feedBatch)
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)

  // Порция загружается при первом открытии ленты и перечитывается при входе и выходе
  useEffect(() => {
    if (isInvalidId || batch.status === 'loading') return
    if (batch.status === 'idle' || batch.forAuthenticated !== isAuthenticated) {
      dispatch(fetchFeedBatch({ refresh: false, authenticated: isAuthenticated }))
    }
  }, [dispatch, isInvalidId, isAuthenticated, batch.status, batch.forAuthenticated])

  const batchSettled = batch.status === 'ready' || batch.status === 'failed'
  const batchIndex = id === null ? 0 : batch.items.findIndex((item) => item.riscv_command.id === id)
  const batchItem = batch.status === 'ready' && batchIndex !== -1 ? batch.items[batchIndex] : null

  useEffect(() => {
    if (!isInvalidId && batchSettled && !batchItem) {
      dispatch(fetchFeed({ id }))
    }
  }, [dispatch, id, isInvalidId, isAuthenticated, batchSettled, batchItem === null])

  const current = batchItem
    ? { riscv_command: batchItem.riscv_command, is_liked: batchItem.is_liked }
    : feed

  useDocumentTitle(current ? `${current.riscv_command.mnemonic} · RISC-V` : 'Лента · RISC-V')

  const handleLike = () => {
    if (!current) return
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN)
      return
    }
    dispatch(
      setLike({
        id: current.riscv_command.id,
        like: current.is_liked === 1 ? 0 : 1,
      }),
    )
  }

  // После последней команды порции формируется следующая; номера в сессии продолжаются
  const isLastInBatch = batchItem !== null && batchIndex === batch.items.length - 1
  const handleNext = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isLastInBatch) return
    event.preventDefault()
    dispatch(fetchFeedBatch({ refresh: true, authenticated: isAuthenticated }))
      .unwrap()
      .then(() => navigate(ROUTES.FEED))
      .catch(() => undefined)
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

  if (!batchItem && feedError && !feedLoading && batchSettled) {
    return (
      <StatusMessage
        heading="Команда не найдена"
        message={feedError}
        actionURL={ROUTES.FEED}
        actionLabel="Открыть ленту"
      />
    )
  }

  const nextId = batchItem
    ? batch.items[(batchIndex + 1) % batch.items.length].riscv_command.id
    : (feed?.next_id ?? 0)

  return (
    <main className="page-view feed-page">
      {current && batch.status !== 'loading' && (
        <>
          {likeError && (
            <p className="feed-error" role="alert">
              {likeError}
            </p>
          )}
          <RiscVCommandFeedView
            key={current.riscv_command.id}
            riscvCommand={current.riscv_command}
            nextId={nextId}
            isLiked={current.is_liked === 1}
            isAuthenticated={isAuthenticated}
            likePending={likePending}
            onLike={handleLike}
            position={batchItem?.position}
            onNext={batchItem ? handleNext : undefined}
          />
        </>
      )}
    </main>
  )
}
