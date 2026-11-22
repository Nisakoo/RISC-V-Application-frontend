import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api'
import { DomainRiscVCommandStatus } from '../api/Api'
import type { HandlerApiCommand } from '../api/Api'
import { createAppStore } from '../store'
import { setUser } from '../slices/userSlice'
import { RiscVCommandAddPage } from './RiscVCommandAddPage'

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
  operand_count: 2,
  status: DomainRiscVCommandStatus.RiscVCommandPublished,
}

const httpError = (status: number, message: string) =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { message } },
  })

const renderAdd = (store = createAppStore()) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/riscv_commands/add']}>
        <Routes>
          <Route path="/riscv_commands/add" element={<RiscVCommandAddPage />} />
          <Route path="/login" element={<div>Страница входа</div>} />
          <Route path="/riscv_commands/grid" element={<div>Плитка открыта</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

beforeEach(() => {
  vi.mocked(api.riscvCommandsDraftList).mockReset()
  vi.mocked(api.riscvCommandsCreate).mockReset()
  vi.mocked(api.riscvCommandsPublishUpdate).mockReset()
})

describe('страница добавления команды', () => {
  it('перенаправляет гостя на вход', async () => {
    renderAdd()
    expect(await screen.findByText('Страница входа')).toBeInTheDocument()
  })

  it('создаёт черновик и публикует его', async () => {
    vi.mocked(api.riscvCommandsDraftList).mockRejectedValue(
      httpError(404, 'Черновик команды RISC-V не найден.'),
    )
    vi.mocked(api.riscvCommandsCreate).mockResolvedValue({ data: draftCommand } as never)
    vi.mocked(api.riscvCommandsPublishUpdate).mockResolvedValue({
      data: publishedCommand,
    } as never)

    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))
    renderAdd(store)

    expect(await screen.findByLabelText('Мнемоника')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Мнемоника'), { target: { value: 'XORI' } })

    const image = new File(['image'], 'XORI.png', { type: 'image/png' })
    const video = new File(['video'], 'XORI.mp4', { type: 'video/mp4' })
    fireEvent.change(screen.getByLabelText('Изображение'), { target: { files: [image] } })
    fireEvent.change(screen.getByLabelText('Короткое видео'), { target: { files: [video] } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать черновик' }))

    expect(await screen.findByText(/Черновик команды/)).toBeInTheDocument()
    expect(api.riscvCommandsCreate).toHaveBeenCalledWith({ mnemonic: 'XORI', image, video })

    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: publishedCommand.description },
    })
    fireEvent.change(screen.getByLabelText('Количество операндов'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Длина команды, бит'), { target: { value: '32' } })
    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать' }))

    expect(await screen.findByText('Плитка открыта')).toBeInTheDocument()
    expect(api.riscvCommandsPublishUpdate).toHaveBeenCalledWith(5, {
      description: publishedCommand.description,
      operand_count: 2,
      length_bits: 32,
    })
  })

  it('показывает ошибку валидации описания', async () => {
    vi.mocked(api.riscvCommandsDraftList).mockResolvedValue({ data: draftCommand } as never)
    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))
    renderAdd(store)

    expect(await screen.findByLabelText('Описание')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Описание'), { target: { value: 'Коротко' } })
    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Описание должно содержать от 10 до 1000 символов.',
    )
    expect(api.riscvCommandsPublishUpdate).not.toHaveBeenCalled()
  })
})
