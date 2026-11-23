import {
  RiscVCommand,
  RiscVCommandFeed,
  RiscVCommandListItem,
  RiscVCommandPage,
  OperandRange,
} from './riscvCommand'

// Mock-коллекция опубликованных команд RISC-V. Поля совпадают с JSON API backend.
// Поля медиа у всех команд пустые: хук useMediaFallback подставляет изображение и видео по умолчанию.
export const RISCV_COMMANDS_MOCK: RiscVCommand[] = [
  {
    id: 1,
    mnemonic: 'ADD',
    description:
      'Складывает значения исходных регистров rs1 и rs2, затем сохраняет сумму в целевой регистр rd.',
    operand_count: 3,
    length_bits: 32,
    image_url: '',
    video_url: '',
    like_count: 4,
  },
  {
    id: 4,
    mnemonic: 'SUB',
    description:
      'Вычитает значение регистра rs2 из регистра rs1 и записывает полученную разность в целевой регистр rd.',
    operand_count: 3,
    length_bits: 32,
    image_url: '',
    video_url: '',
    like_count: 3,
  },
  {
    id: 9,
    mnemonic: 'ADDI',
    description:
      'Складывает значение регистра rs1 со знаково расширенным immediate и сохраняет результат в rd.',
    operand_count: 3,
    length_bits: 32,
    image_url: '',
    video_url: '',
    like_count: 3,
  },
  {
    id: 15,
    mnemonic: 'BEQ',
    description:
      'Сравнивает значения rs1 и rs2 и при равенстве выполняет переход по заданному смещению.',
    operand_count: 3,
    length_bits: 32,
    image_url: '',
    video_url: '',
    like_count: 2,
  },
  {
    id: 23,
    mnemonic: 'LUI',
    description: 'Помещает двадцатибитное immediate в старшие разряды целевого регистра rd.',
    operand_count: 2,
    length_bits: 32,
    image_url: '',
    video_url: '',
    like_count: 2,
  },
  {
    id: 42,
    mnemonic: 'JAL',
    description:
      'Выполняет безусловный переход и сохраняет адрес следующей команды в регистре rd.',
    operand_count: 2,
    length_bits: 32,
    image_url: '',
    video_url: '',
    like_count: 2,
  },
  {
    id: 51,
    mnemonic: 'XOR',
    description:
      'Выполняет побитовое исключающее ИЛИ значений регистров rs1 и rs2 и записывает результат в rd.',
    operand_count: 3,
    length_bits: 32,
    image_url: '',
    video_url: '',
    like_count: 1,
  },
  {
    id: 64,
    mnemonic: 'ECALL',
    description:
      'Передаёт управление среде исполнения для системного вызова; номер вызова берётся из регистра a7.',
    operand_count: 0,
    length_bits: 32,
    image_url: '',
    video_url: '',
    like_count: 0,
  },
  {
    id: 70,
    mnemonic: 'C.ADDI',
    description:
      'Сжатая команда расширения C: прибавляет знаково расширенное шестибитное immediate к регистру rd.',
    operand_count: 2,
    length_bits: 16,
    image_url: '',
    video_url: '',
    like_count: 1,
  },
]

// Mock-аналог GET /api/riscv_commands: фильтрация по количеству операндов
export const filterMockCommands = ({
  min_operands,
  max_operands,
}: OperandRange): RiscVCommandListItem[] =>
  RISCV_COMMANDS_MOCK.filter(
    (command) => command.operand_count >= min_operands && command.operand_count <= max_operands,
  ).map((command) => ({ ...command, is_creator: 0 }))

// Mock-аналог страницы GET /api/riscv_commands: фильтр и пагинация по mock-коллекции
export const getMockCommandPage = (
  range: OperandRange,
  page: number,
  limit: number,
): RiscVCommandPage => {
  const filtered = filterMockCommands(range)
  return { commands: filtered.slice((page - 1) * limit, page * limit), total: filtered.length }
}

// Mock-аналог GET /api/riscv_commands/feed: команда и id следующей по порядку
export const getMockCommandFeed = (id: number | null): RiscVCommandFeed => {
  const commands = [...RISCV_COMMANDS_MOCK].sort((left, right) => left.id - right.id)
  if (commands.length === 0) {
    throw new Error('В ленте пока нет доступных команд.')
  }

  let index = 0
  if (id !== null) {
    index = commands.findIndex((command) => command.id === id)
    if (index === -1) {
      throw new Error('Команда не найдена.')
    }
  }

  return {
    riscv_command: commands[index],
    next_id: commands[(index + 1) % commands.length].id,
    is_liked: 0,
  }
}
