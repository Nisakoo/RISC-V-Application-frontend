import { FC, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { OperandRangeFilter } from '../components/OperandRangeFilter'
import { RiscVCommandCard } from '../components/RiscVCommandCard'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import {
  OperandRange,
  RiscVCommand,
  getRiscVCommands,
  parseOperandRange,
} from '../modules/riscvCommandsApi'

// Страница плитки: /riscv_commands/grid?min_operands=<0–3>&max_operands=<0–3>
export const RiscVCommandsGridPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  // Фильтр хранится в URL, поэтому сохраняется при обновлении страницы и переходе назад
  const { min_operands, max_operands } = parseOperandRange(searchParams)
  const [riscvCommands, setRiscVCommands] = useState<RiscVCommand[]>()
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useDocumentTitle('Команды · RISC-V')

  useEffect(() => {
    let isActual = true
    setIsLoading(true)
    getRiscVCommands({ min_operands, max_operands })
      .then((commands) => {
        if (!isActual) return
        setRiscVCommands(commands)
        setErrorMessage('')
      })
      .catch(() => isActual && setErrorMessage('Не удалось загрузить команды.'))
      .finally(() => isActual && setIsLoading(false))
    return () => {
      isActual = false
    }
  }, [min_operands, max_operands])

  const handleFilterSubmit = (range: OperandRange) => {
    setSearchParams({
      min_operands: String(range.min_operands),
      max_operands: String(range.max_operands),
    })
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
        {errorMessage && (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        )}
        {isLoading && <LoadingIndicator />}
        {riscvCommands && !isLoading && (
          <div className="instruction-grid">
            {riscvCommands.map((riscvCommand) => (
              <RiscVCommandCard key={riscvCommand.id} riscvCommand={riscvCommand} />
            ))}
            {riscvCommands.length === 0 && (
              <p className="instruction-empty">Для выбранного диапазона команд нет.</p>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
