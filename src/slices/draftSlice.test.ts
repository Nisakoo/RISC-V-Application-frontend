import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api'
import { DomainRiscVCommandStatus } from '../api/Api'
import type { HandlerApiCommand } from '../api/Api'
import { createAppStore } from '../store'
import { setUser } from './userSlice'
import { createDraft, fetchDraft, publishDraft, resetDraft, setDraftForm } from './draftSlice'

vi.mock('../api', () => ({
  api: {
    riscvCommandsList: vi.fn(),
    riscvCommandsFeedList: vi.fn(),
    riscvCommandsDraftList: vi.fn(),
    riscvCommandsCreate: vi.fn(),
    riscvCommandsPublishUpdate: vi.fn(),
    riscvCommandsDelete: vi.fn(),
    riscvCommandsLikeCreate: vi.fn(),
  },
}))

const draftCommand: HandlerApiCommand = {
  id: 5,
  mnemonic: 'XORI',
  description: '',
  operand_count: 0,
  length_bits: 32,
  image_url: '',
  video_url: '',
  like_count: 0,
  status: DomainRiscVCommandStatus.RiscVCommandDraft,
}

const publishedCommand: HandlerApiCommand = {
  ...draftCommand,
  description: 'Выполняет побитовое исключающее ИЛИ с immediate.',
  operand_count: 3,
  status: DomainRiscVCommandStatus.RiscVCommandPublished,
}

// Ошибка axios с HTTP-статусом нужна для проверки обработки 404 у черновика
const httpError = (status: number, message: string) =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { message } },
  })

beforeEach(() => {
  vi.mocked(api.riscvCommandsDraftList).mockReset()
  vi.mocked(api.riscvCommandsCreate).mockReset()
  vi.mocked(api.riscvCommandsPublishUpdate).mockReset()
})

describe('слайс черновика', () => {
  it('считает 404 черновика отсутствием черновика', async () => {
    vi.mocked(api.riscvCommandsDraftList).mockRejectedValue(
      httpError(404, 'Черновик команды RISC-V не найден.'),
    )
    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))

    await store.dispatch(fetchDraft()).unwrap()

    expect(store.getState().draft.draft).toBeNull()
    expect(store.getState().draft.loaded).toBe(true)
    expect(store.getState().draft.error).toBeNull()
  })

  it('заполняет форму из существующего черновика', async () => {
    vi.mocked(api.riscvCommandsDraftList).mockResolvedValue({ data: draftCommand } as never)
    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))

    await store.dispatch(fetchDraft()).unwrap()

    expect(store.getState().draft.draft?.mnemonic).toBe('XORI')
    expect(store.getState().draft.form).toEqual({
      mnemonic: 'XORI',
      description: '',
      operandCount: 0,
      lengthBits: 32,
    })
  })

  it('создаёт черновик с файлами и сохраняет его в состоянии', async () => {
    vi.mocked(api.riscvCommandsCreate).mockResolvedValue({ data: draftCommand } as never)
    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))
    const image = new File(['image'], 'XORI.png', { type: 'image/png' })
    const video = new File(['video'], 'XORI.mp4', { type: 'video/mp4' })

    await store.dispatch(createDraft({ mnemonic: 'XORI', image, video })).unwrap()

    expect(store.getState().draft.draft?.id).toBe(5)
    expect(api.riscvCommandsCreate).toHaveBeenCalledWith({ mnemonic: 'XORI', image, video })
  })

  it('публикует черновик и обновляет форму', async () => {
    vi.mocked(api.riscvCommandsPublishUpdate).mockResolvedValue({
      data: publishedCommand,
    } as never)
    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))
    store.dispatch(setDraftForm({ description: publishedCommand.description ?? '' }))

    await store.dispatch(
      publishDraft({
        id: 5,
        description: publishedCommand.description ?? '',
        operandCount: 3,
        lengthBits: 32,
      }),
    ).unwrap()

    expect(store.getState().draft.draft?.status).toBe('published')
    expect(api.riscvCommandsPublishUpdate).toHaveBeenCalledWith(5, {
      description: publishedCommand.description,
      operand_count: 3,
      length_bits: 32,
    })
  })

  it('сбрасывает черновик и форму', () => {
    const store = createAppStore()
    store.dispatch(setDraftForm({ mnemonic: 'XORI', description: 'Описание команды' }))
    store.dispatch(resetDraft())

    expect(store.getState().draft.form.mnemonic).toBe('')
    expect(store.getState().draft.draft).toBeNull()
  })
})
