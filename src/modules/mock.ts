import type { RiscVCommand } from './riscvCommandsApi'

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
