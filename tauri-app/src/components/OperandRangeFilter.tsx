import { CSSProperties, FC, FormEvent, useState } from 'react'
import { Button, Form } from 'react-bootstrap'

export const OPERAND_COUNT_MIN = 0
export const OPERAND_COUNT_MAX = 3

export interface OperandRange {
  min_operands: number
  max_operands: number
}

interface Props {
  // Применённый диапазон страницы списка
  range: OperandRange
  onSubmit: (range: OperandRange) => void
}

const OPERAND_COUNTS = [0, 1, 2, 3]

const rangePercent = (count: number) => (count * 100) / OPERAND_COUNT_MAX

// Фильтр списка по количеству операндов: двойной ползунок 0–3 и кнопка «Найти»
// (тот же компонент, что в основном веб-приложении)
export const OperandRangeFilter: FC<Props> = ({ range, onSubmit }) => {
  // Выбранные, но ещё не применённые границы; применяются по кнопке
  const [minimum, setMinimum] = useState(range.min_operands)
  const [maximum, setMaximum] = useState(range.max_operands)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ min_operands: minimum, max_operands: maximum })
  }

  const rangeStyle = {
    '--range-start': `${rangePercent(minimum)}%`,
    '--range-end': `${rangePercent(maximum)}%`,
  } as CSSProperties

  return (
    <Form className="operand-filter" onSubmit={handleSubmit}>
      <fieldset className="operand-filter__fields">
        <legend className="form-label">Фильтрация по операндам</legend>
        <div className="filter-controls">
          <div className="range-control">
            <div className="operand-range" style={rangeStyle}>
              <Form.Range
                aria-label="Минимальное количество операндов"
                min={OPERAND_COUNT_MIN}
                max={OPERAND_COUNT_MAX}
                value={minimum}
                // Ползунок минимума поднимается наверх, когда оба стоят на правом краю
                className={minimum === OPERAND_COUNT_MAX ? 'form-range--top' : undefined}
                onChange={(event) => setMinimum(Math.min(Number(event.target.value), maximum))}
              />
              <Form.Range
                aria-label="Максимальное количество операндов"
                min={OPERAND_COUNT_MIN}
                max={OPERAND_COUNT_MAX}
                value={maximum}
                onChange={(event) => setMaximum(Math.max(Number(event.target.value), minimum))}
              />
              <span className="operand-range__track" />
              {OPERAND_COUNTS.map((count) => (
                <span
                  key={count}
                  className={`operand-range__dot operand-range__dot--${count}${
                    count >= minimum && count <= maximum ? ' active' : ''
                  }`}
                />
              ))}
            </div>
            <div className="range-labels">
              {OPERAND_COUNTS.map((count) => (
                <span key={count}>{count}</span>
              ))}
            </div>
          </div>
          <Button type="submit" variant="riscv" className="operand-filter__submit">
            Найти
          </Button>
        </div>
      </fieldset>
    </Form>
  )
}
