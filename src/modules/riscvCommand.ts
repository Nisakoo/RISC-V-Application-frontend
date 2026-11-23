import type {
  DomainRiscVCommandStatus,
  HandlerApiCommand,
  HandlerApiFeedBatch,
  HandlerApiFeedBatchItem,
  HandlerApiFeedCommand,
  HandlerApiListCommand,
} from '../api/Api'

export const OPERAND_COUNT_MIN = 0
export const OPERAND_COUNT_MAX = 3
// Размер страницы плитки: совпадает со значением по умолчанию backend
export const PAGE_LIMIT = 12
export const COMMAND_LENGTH_OPTIONS = [16, 32, 48, 64] as const

// Доменная модель команды с обязательными полями, которые нужны интерфейсу
export interface RiscVCommand {
  id: number
  mnemonic: string
  description: string
  operand_count: number
  length_bits: number
  image_url: string
  video_url: string
  like_count: number
  creator_login?: string
  status?: DomainRiscVCommandStatus
}

// Команда плитки содержит признак авторства текущего пользователя
export interface RiscVCommandListItem extends RiscVCommand {
  is_creator: 0 | 1
}

// Лента хранит команду, признак лайка и идентификатор следующей команды
export interface RiscVCommandFeed {
  riscv_command: RiscVCommand
  next_id: number
  is_liked: 0 | 1
}

// Страница плитки: команды страницы и общее количество команд фильтра
export interface RiscVCommandPage {
  commands: RiscVCommandListItem[]
  total: number
}

// Команда порции ленты с порядковым номером в сессии
export interface FeedBatchItem {
  riscv_command: RiscVCommand
  position: number
  is_liked: 0 | 1
}

export interface FeedBatch {
  session_id: string
  batch_number: number
  items: FeedBatchItem[]
}

export interface OperandRange {
  min_operands: number
  max_operands: number
}

const operandCountParameter = (value: string | null, fallback: number): number => {
  if (value === null || !/^\d+$/.test(value)) return fallback
  const count = Number(value)
  return count >= OPERAND_COUNT_MIN && count <= OPERAND_COUNT_MAX ? count : fallback
}

// Читает диапазон количества операндов из URL и упорядочивает границы
export const parseOperandRange = (searchParams: URLSearchParams): OperandRange => {
  const minimum = operandCountParameter(searchParams.get('min_operands'), OPERAND_COUNT_MIN)
  const maximum = operandCountParameter(searchParams.get('max_operands'), OPERAND_COUNT_MAX)
  return {
    min_operands: Math.min(minimum, maximum),
    max_operands: Math.max(minimum, maximum),
  }
}

// Приводит необязательные поля сгенерированного клиента к доменной модели
export const toRiscVCommand = (
  command:
    | HandlerApiCommand
    | HandlerApiListCommand
    | HandlerApiFeedCommand
    | HandlerApiFeedBatchItem,
): RiscVCommand => ({
  id: command.id ?? 0,
  mnemonic: command.mnemonic ?? '',
  description: command.description ?? '',
  operand_count: command.operand_count ?? 0,
  length_bits: command.length_bits ?? 32,
  image_url: command.image_url ?? '',
  video_url: command.video_url ?? '',
  like_count: command.like_count ?? 0,
  creator_login: command.creator_login,
  status: command.status,
})

export const toRiscVCommandListItem = (command: HandlerApiListCommand): RiscVCommandListItem => ({
  ...toRiscVCommand(command),
  is_creator: command.is_creator === 1 ? 1 : 0,
})

export const toRiscVCommandFeed = (command: HandlerApiFeedCommand): RiscVCommandFeed => ({
  riscv_command: toRiscVCommand(command),
  next_id: command.next_id ?? command.id ?? 0,
  is_liked: command.is_liked === 1 ? 1 : 0,
})

const toFeedBatchItem = (item: HandlerApiFeedBatchItem): FeedBatchItem => ({
  riscv_command: toRiscVCommand(item),
  position: item.position ?? 0,
  is_liked: item.is_liked === 1 ? 1 : 0,
})

export const toFeedBatch = (batch: HandlerApiFeedBatch): FeedBatch => ({
  session_id: batch.session_id ?? '',
  batch_number: batch.batch_number ?? 1,
  items: (batch.items ?? []).map(toFeedBatchItem),
})

// Номер страницы из URL: положительное целое, иначе первая страница
export const parsePage = (searchParams: URLSearchParams): number => {
  const value = searchParams.get('page')
  return value !== null && /^[1-9]\d{0,6}$/.test(value) ? Number(value) : 1
}
