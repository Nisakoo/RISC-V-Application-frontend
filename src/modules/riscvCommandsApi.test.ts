import { describe, expect, it } from 'vitest'
import { RISCV_COMMANDS_MOCK } from './mock'
import {
  RiscVCommandError,
  getRiscVCommandFeed,
  getRiscVCommands,
  parseOperandRange,
} from './riscvCommandsApi'

describe('parseOperandRange', () => {
  it('без параметров возвращает полный диапазон 0–3', () => {
    expect(parseOperandRange(new URLSearchParams())).toEqual({ min_operands: 0, max_operands: 3 })
  })

  it('заменяет некорректные значения значениями по умолчанию', () => {
    const range = parseOperandRange(new URLSearchParams('min_operands=-1&max_operands=7'))
    expect(range).toEqual({ min_operands: 0, max_operands: 3 })
    expect(parseOperandRange(new URLSearchParams('min_operands=1.5'))).toEqual({
      min_operands: 0,
      max_operands: 3,
    })
  })

  it('упорядочивает перепутанные границы', () => {
    const range = parseOperandRange(new URLSearchParams('min_operands=3&max_operands=2'))
    expect(range).toEqual({ min_operands: 2, max_operands: 3 })
  })
})

describe('getRiscVCommands', () => {
  it('фильтрует команды по количеству операндов включительно', async () => {
    const commands = await getRiscVCommands({ min_operands: 2, max_operands: 2 })
    expect(commands.map((command) => command.mnemonic)).toEqual(['LUI', 'JAL', 'C.ADDI'])
  })

  it('без ограничений возвращает всю коллекцию', async () => {
    const commands = await getRiscVCommands({ min_operands: 0, max_operands: 3 })
    expect(commands).toHaveLength(RISCV_COMMANDS_MOCK.length)
  })
})

describe('getRiscVCommandFeed', () => {
  it('без id возвращает первую команду и id следующей', async () => {
    const feed = await getRiscVCommandFeed(null)
    expect(feed.riscv_command.mnemonic).toBe('ADD')
    expect(feed.next_id).toBe(4)
  })

  it('после последней команды переходит к первой', async () => {
    const feed = await getRiscVCommandFeed('70')
    expect(feed.riscv_command.mnemonic).toBe('C.ADDI')
    expect(feed.next_id).toBe(1)
  })

  it('отклоняет некорректный и несуществующий id', async () => {
    await expect(getRiscVCommandFeed('abc')).rejects.toThrow('Некорректный идентификатор команды.')
    await expect(getRiscVCommandFeed('0')).rejects.toBeInstanceOf(RiscVCommandError)
    await expect(getRiscVCommandFeed('999')).rejects.toThrow('Команда не найдена.')
  })
})
