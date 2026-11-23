import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api'
import type { HandlerApiFeedCommand, HandlerApiListCommand } from '../api/Api'
import { createAppStore } from '../store'
import { setUser } from './userSlice'
import {
  deleteCommand,
  fetchCommands,
  fetchFeed,
  resetFilters,
  setFilters,
  setLike,
} from './riscvCommandsSlice'

vi.mock('../api', () => ({
  api: {
    riscvCommandsList: vi.fn(),
    riscvCommandsFeedList: vi.fn(),
    riscvCommandsFeedBatchList: vi.fn(),
    riscvCommandsDraftList: vi.fn(),
    riscvCommandsCreate: vi.fn(),
    riscvCommandsPublishUpdate: vi.fn(),
    riscvCommandsDelete: vi.fn(),
    riscvCommandsLikeCreate: vi.fn(),
  },
}))

const listCommand: HandlerApiListCommand = {
  id: 1,
  mnemonic: 'ADD',
  description: 'Складывает значения регистров.',
  operand_count: 3,
  length_bits: 32,
  image_url: '',
  video_url: '',
  like_count: 2,
  is_creator: 1,
}

const feedCommand: HandlerApiFeedCommand = {
  ...listCommand,
  is_liked: 0,
  next_id: 4,
}

const authorize = (store: ReturnType<typeof createAppStore>) => {
  store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))
}

beforeEach(() => {
  vi.mocked(api.riscvCommandsList).mockReset()
  vi.mocked(api.riscvCommandsFeedList).mockReset()
  vi.mocked(api.riscvCommandsDelete).mockReset()
  vi.mocked(api.riscvCommandsLikeCreate).mockReset()
})

describe('слайс команд', () => {
  it('сохраняет фильтр и сбрасывает его к диапазону по умолчанию', () => {
    const store = createAppStore()
    store.dispatch(setFilters({ min_operands: 1, max_operands: 2 }))
    expect(store.getState().riscvCommands.filters).toEqual({
      min_operands: 1,
      max_operands: 2,
    })

    store.dispatch(resetFilters())
    expect(store.getState().riscvCommands.filters).toEqual({
      min_operands: 0,
      max_operands: 3,
    })
  })

  it('загружает список через сгенерированный клиент', async () => {
    vi.mocked(api.riscvCommandsList).mockResolvedValue({
      data: { data: [listCommand], total: 1, page: 1, limit: 12 },
    } as never)
    const store = createAppStore()

    await store.dispatch(fetchCommands()).unwrap()

    expect(store.getState().riscvCommands.commands).toEqual([
      { ...listCommand, creator_login: undefined, status: undefined },
    ])
    expect(store.getState().riscvCommands.total).toBe(1)
    expect(api.riscvCommandsList).toHaveBeenCalledWith({
      min_operands: 0,
      max_operands: 3,
      page: 1,
      limit: 12,
    })
  })

  it('подставляет mock-команды гостю при недоступном backend', async () => {
    vi.mocked(api.riscvCommandsList).mockRejectedValue(new Error('offline'))
    const store = createAppStore()

    await store.dispatch(fetchCommands()).unwrap()

    expect(store.getState().riscvCommands.commands).toHaveLength(9)
    expect(store.getState().riscvCommands.commands.every((command) => command.is_creator === 0)).toBe(
      true,
    )
  })

  it('не подставляет mock гостю, если backend ответил ошибкой', async () => {
    vi.mocked(api.riscvCommandsFeedList).mockRejectedValue(
      Object.assign(new Error('not found'), {
        isAxiosError: true,
        response: { status: 404, data: { message: 'Команда не найдена.' } },
      }),
    )
    const store = createAppStore()

    const result = await store.dispatch(fetchFeed({ id: 1 }))

    expect(result.type).toBe('riscvCommands/fetchFeed/rejected')
    expect(store.getState().riscvCommands.feed).toBeNull()
    expect(store.getState().riscvCommands.feedError).toBe('Команда не найдена.')
  })

  it('не подменяет ошибку mock-данными для авторизованного пользователя', async () => {
    vi.mocked(api.riscvCommandsList).mockRejectedValue(new Error('offline'))
    const store = createAppStore()
    authorize(store)

    const result = await store.dispatch(
      fetchCommands(),
    )

    expect(result.type).toBe('riscvCommands/fetchCommands/rejected')
    expect(store.getState().riscvCommands.commands).toEqual([])
    expect(store.getState().riscvCommands.listError).toBe('Не удалось загрузить команды.')
  })

  it('загружает ленту и подставляет mock-ленту гостю при ошибке', async () => {
    vi.mocked(api.riscvCommandsFeedList).mockResolvedValue({ data: feedCommand } as never)
    const store = createAppStore()

    await store.dispatch(fetchFeed({ id: 1 })).unwrap()
    expect(store.getState().riscvCommands.feed?.riscv_command.mnemonic).toBe('ADD')
    expect(store.getState().riscvCommands.feed?.next_id).toBe(4)

    vi.mocked(api.riscvCommandsFeedList).mockRejectedValue(new Error('offline'))
    await store.dispatch(fetchFeed({ id: 23 })).unwrap()
    expect(store.getState().riscvCommands.feed?.riscv_command.mnemonic).toBe('LUI')
  })

  it('сохраняет лайк и обновляет счётчик в ленте', async () => {
    vi.mocked(api.riscvCommandsFeedList).mockResolvedValue({ data: feedCommand } as never)
    vi.mocked(api.riscvCommandsLikeCreate).mockResolvedValue({
      data: { like: 1, like_count: 5 },
    } as never)
    const store = createAppStore()
    authorize(store)

    await store.dispatch(fetchFeed({ id: 1 })).unwrap()
    await store.dispatch(setLike({ id: 1, like: 1 })).unwrap()

    expect(store.getState().riscvCommands.feed?.is_liked).toBe(1)
    expect(store.getState().riscvCommands.feed?.riscv_command.like_count).toBe(5)
  })

  it('удаляет команду из списка после успешного запроса', async () => {
    vi.mocked(api.riscvCommandsList).mockResolvedValue({
      data: { data: [listCommand], total: 1, page: 1, limit: 12 },
    } as never)
    vi.mocked(api.riscvCommandsDelete).mockResolvedValue({ data: undefined } as never)
    const store = createAppStore()
    authorize(store)

    await store.dispatch(fetchCommands()).unwrap()
    await store.dispatch(deleteCommand(1)).unwrap()

    expect(store.getState().riscvCommands.commands).toEqual([])
    expect(api.riscvCommandsDelete).toHaveBeenCalledWith(1)
  })
})
