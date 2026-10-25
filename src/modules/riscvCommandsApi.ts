import { RISCV_COMMANDS_MOCK } from './mock'

export interface RiscVCommand {
  id: number
  mnemonic: string
  description: string
  operand_count: number
  length_bits: number
  image_url: string
  video_url: string
  like_count: number
}

export interface RiscVCommandFeed {
  riscv_command: RiscVCommand
  next_id: number
}

export interface OperandRange {
  min_operands: number
  max_operands: number
}

export const OPERAND_COUNT_MIN = 0
export const OPERAND_COUNT_MAX = 3

// Задержка ответа mock-функций имитирует сеть, чтобы было видно индикатор загрузки
const MOCK_DELAY_MS = 300

const mockResponse = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))

// Ошибка с понятным пользователю сообщением, как в SSR-страницах backend
export class RiscVCommandError extends Error {
  constructor(
    readonly heading: string,
    message: string,
  ) {
    super(message)
    this.name = 'RiscVCommandError'
  }
}

// Значение вне диапазона 0–3 заменяется значением по умолчанию, как в backend
const operandCountParameter = (value: string | null, fallback: number): number => {
  if (value === null || !/^\d+$/.test(value)) return fallback
  const count = Number(value)
  return count >= OPERAND_COUNT_MIN && count <= OPERAND_COUNT_MAX ? count : fallback
}

// Читает диапазон количества операндов из параметров URL и упорядочивает границы
export const parseOperandRange = (searchParams: URLSearchParams): OperandRange => {
  const minimum = operandCountParameter(searchParams.get('min_operands'), OPERAND_COUNT_MIN)
  const maximum = operandCountParameter(searchParams.get('max_operands'), OPERAND_COUNT_MAX)
  return {
    min_operands: Math.min(minimum, maximum),
    max_operands: Math.max(minimum, maximum),
  }
}

// Mock-аналог GET /api/riscv_commands: фильтрация по количеству операндов
export const getRiscVCommands = async ({
  min_operands,
  max_operands,
}: OperandRange): Promise<RiscVCommand[]> => {
  await mockResponse()
  return RISCV_COMMANDS_MOCK.filter(
    (command) => command.operand_count >= min_operands && command.operand_count <= max_operands,
  )
}

// Mock-аналог GET /api/riscv_commands/feed?id=<id>: команда и id следующей по порядку,
// после последней команды лента начинается сначала
export const getRiscVCommandFeed = async (id: string | null): Promise<RiscVCommandFeed> => {
  await mockResponse()
  const commands = [...RISCV_COMMANDS_MOCK].sort((left, right) => left.id - right.id)
  if (commands.length === 0) {
    throw new RiscVCommandError('Команда не найдена', 'В ленте пока нет доступных команд.')
  }

  let index = 0
  if (id !== null) {
    if (!/^[1-9]\d*$/.test(id)) {
      throw new RiscVCommandError('Некорректный идентификатор', 'Некорректный идентификатор команды.')
    }
    index = commands.findIndex((command) => command.id === Number(id))
    if (index === -1) {
      throw new RiscVCommandError('Команда не найдена', 'Команда не найдена.')
    }
  }

  return {
    riscv_command: commands[index],
    next_id: commands[(index + 1) % commands.length].id,
  }
}
