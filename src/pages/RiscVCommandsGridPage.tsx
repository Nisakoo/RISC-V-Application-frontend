import { FC, useEffect, useRef } from 'react'
import { useStore } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { OperandRangeFilter } from '../components/OperandRangeFilter'
import { Pagination } from '../components/Pagination'
import { RiscVCommandCard } from '../components/RiscVCommandCard'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAppDispatch, useAppSelector } from '../hooks/store'
import {
  OPERAND_COUNT_MAX,
  OPERAND_COUNT_MIN,
  PAGE_LIMIT,
  parseOperandRange,
  parsePage,
} from '../modules/riscvCommand'
import type { RootState } from '../store'
import { deleteCommand, fetchCommands, setFilters, setPage } from '../slices/riscvCommandsSlice'

// Страница плитки: /riscv_commands/grid?min_operands=<0–3>&max_operands=<0–3>&page=<n>
export const RiscVCommandsGridPage: FC = () => {
  useDocumentTitle('Команды · RISC-V')
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { min_operands, max_operands } = parseOperandRange(searchParams)
  const page = parsePage(searchParams)

  const { commands, total, listLoading, listError, deletingId } = useAppSelector(
    (state) => state.riscvCommands,
  )
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)

  // При возврате из ленты адрес приходит без параметров: сохранённый в Redux фильтр
  // возвращается в URL, а не затирается диапазоном по умолчанию.
  // Эффект объявлен раньше загрузки, поэтому читает фильтр до его перезаписи.
  const store = useStore<RootState>()
  const isRestoring = useRef(false)
  useEffect(() => {
    const stored = store.getState().riscvCommands.filters
    const hasFilterInUrl = searchParams.has('min_operands') || searchParams.has('max_operands')
    const isDefault =
      stored.min_operands === OPERAND_COUNT_MIN && stored.max_operands === OPERAND_COUNT_MAX
    if (hasFilterInUrl || isDefault) return
    isRestoring.current = true
    setSearchParams(
      { min_operands: String(stored.min_operands), max_operands: String(stored.max_operands) },
      { replace: true },
    )
    // Восстановление выполняется один раз при открытии страницы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Фильтр хранится в Redux, а URL сохраняет его при обновлении страницы и переходе назад
  useEffect(() => {
    // Пока фильтр восстанавливается в URL, запрос с диапазоном по умолчанию не нужен
    if (isRestoring.current) {
      isRestoring.current = false
      return
    }
    dispatch(setFilters({ min_operands, max_operands }))
    dispatch(setPage(page))
    dispatch(fetchCommands())
  }, [dispatch, min_operands, max_operands, page, isAuthenticated])

  const handleFilterSubmit = (range: { min_operands: number; max_operands: number }) => {
    setSearchParams({
      min_operands: String(range.min_operands),
      max_operands: String(range.max_operands),
    })
  }

  // Номер страницы хранится в URL вместе с фильтром
  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('min_operands', String(min_operands))
    next.set('max_operands', String(max_operands))
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

  const handleDelete = (id: number) => {
    dispatch(deleteCommand(id))
  }

  return (
    <main className="page-view plain-page">
      <section className="page-content riscv-commands-page">
        <h1>Команды</h1>
        <OperandRangeFilter
          // Новый ключ сбрасывает ползунки, когда диапазон в URL меняется извне
          key={`${min_operands}-${max_operands}`}
          range={{ min_operands, max_operands }}
          onSubmit={handleFilterSubmit}
        />
        {listError && (
          <p className="form-error" role="alert">
            {listError}
          </p>
        )}
        {!listLoading && total > 0 && (
          <p className="instruction-total">
            Найдено команд: {total}. Страница {page} из {totalPages}.
          </p>
        )}
        {!listLoading && (
          <div className="instruction-grid">
            {commands.map((riscvCommand) => (
              <RiscVCommandCard
                key={riscvCommand.id}
                riscvCommand={riscvCommand}
                onDelete={
                  isAuthenticated && riscvCommand.is_creator === 1
                    ? () => handleDelete(riscvCommand.id)
                    : undefined
                }
                isDeleting={deletingId === riscvCommand.id}
              />
            ))}
            {commands.length === 0 && (
              <p className="instruction-empty">Для выбранного диапазона команд нет.</p>
            )}
          </div>
        )}
        <div className="d-flex justify-content-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </section>
    </main>
  )
}
