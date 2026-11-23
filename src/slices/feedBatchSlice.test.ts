import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api'
import { createAppStore } from '../store'
import { fetchFeedBatch } from './feedBatchSlice'
import { fetchCommands, setPage } from './riscvCommandsSlice'

vi.mock('../api', () => ({
  api: {
    riscvCommandsList: vi.fn(),
    riscvCommandsFeedBatchList: vi.fn(),
    riscvCommandsLikeCreate: vi.fn(),
    riscvCommandsDelete: vi.fn(),
  },
}))

const batchResponse = {
  session_id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  batch_number: 1,
  first_position: 1,
  items: [
    { id: 5, mnemonic: 'XOR', operand_count: 3, length_bits: 32, position: 1, is_liked: 1 },
  ],
}

beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(api.riscvCommandsFeedBatchList).mockReset()
  vi.mocked(api.riscvCommandsList).mockReset()
})

describe('слайс порции ленты', () => {
  it('сохраняет порцию и идентификатор сессии, затем передаёт его в следующий запрос', async () => {
    vi.mocked(api.riscvCommandsFeedBatchList).mockResolvedValue({ data: batchResponse } as never)
    const store = createAppStore()

    await store.dispatch(fetchFeedBatch({ refresh: false, authenticated: false })).unwrap()
    const state = store.getState().feedBatch
    expect(state.status).toBe('ready')
    expect(state.items[0]).toMatchObject({ position: 1, is_liked: 1 })
    expect(sessionStorage.getItem('riscv.feed_session')).toBe(batchResponse.session_id)

    await store.dispatch(fetchFeedBatch({ refresh: true, authenticated: false })).unwrap()
    expect(api.riscvCommandsFeedBatchList).toHaveBeenLastCalledWith({
      session_id: batchResponse.session_id,
      refresh: true,
    })
  })

  it('переходит в failed, если backend недоступен', async () => {
    vi.mocked(api.riscvCommandsFeedBatchList).mockRejectedValue(new Error('offline'))
    const store = createAppStore()

    await store.dispatch(fetchFeedBatch({ refresh: false, authenticated: false }))
    expect(store.getState().feedBatch.status).toBe('failed')
  })
})

describe('пагинация плитки', () => {
  it('передаёт номер страницы в запрос и сохраняет общее количество', async () => {
    vi.mocked(api.riscvCommandsList).mockResolvedValue({
      data: { data: [], total: 120, page: 4, limit: 12 },
    } as never)
    const store = createAppStore()

    store.dispatch(setPage(4))
    await store.dispatch(fetchCommands()).unwrap()

    expect(api.riscvCommandsList).toHaveBeenCalledWith({
      min_operands: 0,
      max_operands: 3,
      page: 4,
      limit: 12,
    })
    expect(store.getState().riscvCommands.total).toBe(120)
  })

  it('пагинирует mock-коллекцию гостя при недоступном backend', async () => {
    vi.mocked(api.riscvCommandsList).mockRejectedValue(new Error('offline'))
    const store = createAppStore()

    store.dispatch(setPage(2))
    await store.dispatch(fetchCommands()).unwrap()

    // Во второй странице по 12 команд mock-коллекции (9 штук) команд нет, но общее количество известно
    expect(store.getState().riscvCommands.commands).toHaveLength(0)
    expect(store.getState().riscvCommands.total).toBe(9)
  })
})
