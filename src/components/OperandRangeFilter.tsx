import { CSSProperties, FC, FormEvent, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { OPERAND_COUNT_MAX, OPERAND_COUNT_MIN, OperandRange } from '../modules/riscvCommandsApi'

interface Props {
  // Примененный диапазон из URL страницы плитки
  range: OperandRange
  onSubmit: (range: OperandRange) => void
}

const OPERAND_COUNTS = [0, 1, 2, 3]

const rangePercent = (count: number) => (count * 100) / OPERAND_COUNT_MAX

// Фильтр плитки по количеству операндов: двойной ползунок 0–3 и кнопка «Показать»
export const OperandRangeFilter: FC<Props> = ({ range, onSubmit }) => {
  // Выбранные, но еще не применённые границы; применяются по кнопке
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
        <legend className="form-label">Количество операндов</legend>
        <div className="filter-controls">
          <div className="range-control">
            <div className="operand-range" style={rangeStyle}>
              <Form.Range
                aria-label="Минимальное количество операндов"
                name="min_operands"
                min={OPERAND_COUNT_MIN}
                max={OPERAND_COUNT_MAX}
                value={minimum}
                // Ползунок минимума поднимается наверх, когда оба стоят на правом краю
                className={minimum === OPERAND_COUNT_MAX ? 'form-range--top' : undefined}
                onChange={(event) => setMinimum(Math.min(Number(event.target.value), maximum))}
              />
              <Form.Range
                aria-label="Максимальное количество операндов"
                name="max_operands"
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
            Показать
          </Button>
        </div>
      </fieldset>
    </Form>
  )
}
