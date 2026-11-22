import { FC, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { OperandRangeFilter } from '../components/OperandRangeFilter'
import { RiscVCommandCard } from '../components/RiscVCommandCard'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAppDispatch, useAppSelector } from '../hooks/store'
import { parseOperandRange } from '../modules/riscvCommand'
import { deleteCommand, fetchCommands, setFilters } from '../slices/riscvCommandsSlice'

// Страница плитки: /riscv_commands/grid?min_operands=<0–3>&max_operands=<0–3>
export const RiscVCommandsGridPage: FC = () => {
  useDocumentTitle('Команды · RISC-V')
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { min_operands, max_operands } = parseOperandRange(searchParams)

  const { commands, listLoading, listError, deletingId } = useAppSelector(
    (state) => state.riscvCommands,
  )
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)

  // Фильтр хранится в Redux, а URL сохраняет его при обновлении страницы и переходе назад
  useEffect(() => {
    dispatch(setFilters({ min_operands, max_operands }))
    dispatch(fetchCommands())
  }, [dispatch, min_operands, max_operands, isAuthenticated])

  const handleFilterSubmit = (range: { min_operands: number; max_operands: number }) => {
    setSearchParams({
      min_operands: String(range.min_operands),
      max_operands: String(range.max_operands),
    })
  }

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
      </section>
    </main>
  )
}
