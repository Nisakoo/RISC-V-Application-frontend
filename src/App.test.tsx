import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from './api'
import { http } from './api/http'
import type {
  HandlerApiFeedBatch,
  HandlerApiFeedCommand,
  HandlerApiListCommand,
} from './api/Api'
import { setUser } from './slices/userSlice'
import { AppRoutes } from './App'
import { DEFAULT_IMAGE_URL, DEFAULT_VIDEO_URL } from './modules/media'
import { createAppStore } from './store'

// В тестах backend недоступен: гость должен получать mock-данные
vi.mock('./api', () => ({
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

vi.mock('./api/http', () => ({
  http: {
    post: vi.fn(),
  },
}))

// Показывает текущий адрес, чтобы проверять сохранение фильтра в URL
const LocationProbe = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

const renderAt = (url: string, store = createAppStore()) => {
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>
    </Provider>,
  )
  return { ...view, store }
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(http.post).mockReset()
  vi.mocked(api.riscvCommandsList).mockReset().mockRejectedValue(new Error('offline'))
  vi.mocked(api.riscvCommandsFeedList).mockReset().mockRejectedValue(new Error('offline'))
  vi.mocked(api.riscvCommandsFeedBatchList).mockReset().mockRejectedValue(new Error('offline'))
  sessionStorage.clear()
  vi.mocked(api.riscvCommandsDraftList).mockReset().mockRejectedValue(new Error('offline'))
  vi.mocked(api.riscvCommandsCreate).mockReset().mockRejectedValue(new Error('offline'))
  vi.mocked(api.riscvCommandsPublishUpdate).mockReset().mockRejectedValue(new Error('offline'))
  vi.mocked(api.riscvCommandsDelete).mockReset().mockRejectedValue(new Error('offline'))
  vi.mocked(api.riscvCommandsLikeCreate).mockReset().mockRejectedValue(new Error('offline'))
})

describe('нижняя навигация', () => {
  it('содержит четыре пункта, доступных гостю', async () => {
    renderAt('/riscv_commands/grid')
    const navigation = await screen.findByRole('navigation', { name: 'Основная навигация' })
    const items = within(navigation).getAllByText(/Лента|Добавить|Плитка|Вход/)
    expect(items.map((item) => item.textContent)).toEqual(['Лента', 'Добавить', 'Плитка', 'Вход'])

    expect(within(navigation).getByRole('link', { name: 'Лента' })).toHaveAttribute(
      'href',
      '/riscv_commands/feed',
    )
    expect(within(navigation).getByRole('link', { name: 'Добавить' })).toHaveAttribute(
      'href',
      '/riscv_commands/add',
    )
    expect(within(navigation).getByRole('link', { name: 'Плитка' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(navigation).getByRole('link', { name: 'Вход' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('перенаправляет корневой адрес на ленту', async () => {
    renderAt('/')
    expect(await screen.findByText('ADD')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/riscv_commands/feed')
  })

  it('при выходе очищает сессию и возвращает гостя', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: undefined } as never)
    localStorage.setItem('access_token', 'jwt-token')
    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))
    renderAt('/riscv_commands/grid', store)

    fireEvent.click(await screen.findByRole('button', { name: /Выйти из аккаунта/ }))

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Вход' })).toBeInTheDocument()
    })
    expect(http.post).toHaveBeenCalledWith('/api/users/logout')
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('для авторизованного пользователя вместо входа показывает выход', async () => {
    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))
    renderAt('/riscv_commands/grid', store)

    expect(await screen.findByRole('button', { name: /Выйти из аккаунта/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Вход' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Выйти из аккаунта/ })).toBeInTheDocument()
  })
})

describe('страница плитки', () => {
  it('показывает команды из mock-коллекции после индикатора загрузки', async () => {
    renderAt('/riscv_commands/grid')
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'ADD' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(9)
  })

  it('применяет фильтр по кнопке и сохраняет его в URL', async () => {
    renderAt('/riscv_commands/grid')
    await screen.findByRole('heading', { name: 'ADD' })

    fireEvent.change(screen.getByLabelText('Максимальное количество операндов'), {
      target: { value: '0' },
    })
    // До нажатия кнопки список не меняется
    expect(screen.getAllByRole('article')).toHaveLength(9)
    fireEvent.click(screen.getByRole('button', { name: 'Показать' }))

    expect(await screen.findByRole('heading', { name: 'ECALL' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/riscv_commands/grid?min_operands=0&max_operands=0',
    )
  })

  it('читает фильтр из URL и сообщает об отсутствии команд', async () => {
    renderAt('/riscv_commands/grid?min_operands=1&max_operands=1')
    expect(await screen.findByText('Для выбранного диапазона команд нет.')).toBeInTheDocument()
  })

  it('сохраняет фильтр после перехода в ленту и возврата через навигацию', async () => {
    renderAt('/riscv_commands/grid')
    await screen.findByRole('heading', { name: 'ADD' })
    fireEvent.change(screen.getByLabelText('Максимальное количество операндов'), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Показать' }))
    fireEvent.click(await screen.findByAltText('Схема команды ECALL'))
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/riscv_commands/feed?id=')
    })

    fireEvent.click(screen.getByRole('link', { name: 'Плитка' }))

    expect(await screen.findByRole('heading', { name: 'ECALL' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/riscv_commands/grid?min_operands=0&max_operands=0',
    )
  })

  it('показывает изображение по умолчанию во всех карточках', async () => {
    renderAt('/riscv_commands/grid')
    await screen.findByAltText('Схема команды XOR')
    const images = screen.getAllByAltText(/^Схема команды /)
    expect(images).toHaveLength(9)
    images.forEach((image) => expect(image).toHaveAttribute('src', DEFAULT_IMAGE_URL))
  })

  it('открывает команду в ленте по нажатию на изображение', async () => {
    renderAt('/riscv_commands/grid')
    fireEvent.click(await screen.findByAltText('Схема команды BEQ'))
    expect(await screen.findByText(/при равенстве выполняет переход/)).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/riscv_commands/feed?id=15')
  })
})

describe('страница ленты', () => {
  it('показывает параметры команды и ссылку на следующую', async () => {
    renderAt('/riscv_commands/feed?id=23')
    expect(await screen.findByText('LUI')).toBeInTheDocument()
    const properties = screen.getByLabelText('Параметры инструкции')
    expect(within(properties).getByText('2')).toBeInTheDocument()
    expect(within(properties).getByText('32 бит')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Следующая команда' })).toHaveAttribute(
      'href',
      '/riscv_commands/feed?id=42',
    )
  })

  it('переходит к следующей команде', async () => {
    renderAt('/riscv_commands/feed?id=42')
    fireEvent.click(await screen.findByRole('link', { name: 'Следующая команда' }))
    expect(await screen.findByText('XOR')).toBeInTheDocument()
  })

  it('использует видео и постер по умолчанию', async () => {
    const { container } = renderAt('/riscv_commands/feed?id=1')
    await screen.findByText('ADD')
    const video = container.querySelector('video')
    expect(video).toHaveAttribute('src', DEFAULT_VIDEO_URL)
    expect(video).toHaveAttribute('poster', DEFAULT_IMAGE_URL)
  })

  it('показывает индикатор, пока команда загружается', async () => {
    renderAt('/riscv_commands/feed?id=1')
    expect(screen.getByRole('status')).toBeInTheDocument()
    await screen.findByText('ADD')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('раскрывает и сворачивает описание', async () => {
    renderAt('/riscv_commands/feed')
    const description = await screen.findByRole('button', { expanded: false })
    expect(within(description).getByText('ещё')).toBeInTheDocument()
    fireEvent.click(description)
    expect(within(description).getByText('меньше')).toBeInTheDocument()
  })

  it('сообщает о несуществующей команде', async () => {
    renderAt('/riscv_commands/feed?id=999')
    expect(await screen.findByRole('heading', { name: 'Команда не найдена' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Открыть ленту' })).toHaveAttribute(
      'href',
      '/riscv_commands/feed',
    )
  })

  it('предлагает гостю войти при попытке поставить лайк', async () => {
    renderAt('/riscv_commands/feed?id=1')
    const likeButton = await screen.findByRole('button', { name: 'Войдите, чтобы поставить лайк' })
    fireEvent.click(likeButton)
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('защищает страницу добавления от гостя', async () => {
    renderAt('/riscv_commands/add')
    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })
})


describe('домен команд: действия авторизованного пользователя', () => {
  const ownCommand: HandlerApiListCommand = {
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
    ...ownCommand,
    is_liked: 0,
    next_id: 4,
  }

  it('удаляет свою команду с плитки', async () => {
    vi.mocked(api.riscvCommandsList).mockResolvedValue({ data: { data: [ownCommand], total: 1, page: 1, limit: 12 } } as never)
    vi.mocked(api.riscvCommandsDelete).mockResolvedValue({ data: undefined } as never)
    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))
    renderAt('/riscv_commands/grid', store)

    fireEvent.click(await screen.findByRole('button', { name: 'Удалить' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'ADD' })).not.toBeInTheDocument()
    })
    expect(api.riscvCommandsDelete).toHaveBeenCalledWith(1)
  })

  it('ставит лайк в ленте и обновляет счётчик', async () => {
    vi.mocked(api.riscvCommandsFeedList).mockResolvedValue({ data: feedCommand } as never)
    vi.mocked(api.riscvCommandsLikeCreate).mockResolvedValue({
      data: { like: 1, like_count: 5 },
    } as never)
    const store = createAppStore()
    store.dispatch(setUser({ login: 'rv32_author', role: 'user' }))
    renderAt('/riscv_commands/feed?id=1', store)

    fireEvent.click(await screen.findByRole('button', { name: 'Поставить лайк' }))

    const likedButton = await screen.findByRole('button', { name: 'Убрать лайк' })
    expect(likedButton).toHaveAttribute('aria-pressed', 'true')
    expect(within(likedButton).getByText('5')).toBeInTheDocument()
  })
})

describe('плитка: пагинация', () => {
  const makeCommand = (id: number): HandlerApiListCommand => ({
    id,
    mnemonic: `CMD${id}`,
    description: 'Команда для проверки пагинации.',
    operand_count: 3,
    length_bits: 32,
    image_url: '',
    video_url: '',
    like_count: 0,
    is_creator: 0,
  })

  it('запрашивает страницу из URL и переходит на следующую', async () => {
    vi.mocked(api.riscvCommandsList).mockResolvedValue({
      data: { data: [makeCommand(13)], total: 100, page: 2, limit: 12 },
    } as never)
    renderAt('/riscv_commands/grid?min_operands=0&max_operands=3&page=2')

    expect(await screen.findByText('CMD13')).toBeInTheDocument()
    expect(api.riscvCommandsList).toHaveBeenCalledWith({
      min_operands: 0,
      max_operands: 3,
      page: 2,
      limit: 12,
    })
    // 100 команд по 12 на странице: девять страниц
    expect(screen.getByText('Найдено команд: 100. Страница 2 из 9.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Следующая страница' }))
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/riscv_commands/grid?min_operands=0&max_operands=3&page=3',
      )
    })
  })

  it('сбрасывает страницу при применении фильтра', async () => {
    vi.mocked(api.riscvCommandsList).mockResolvedValue({
      data: { data: [makeCommand(13)], total: 100, page: 3, limit: 12 },
    } as never)
    renderAt('/riscv_commands/grid?min_operands=0&max_operands=3&page=3')
    await screen.findByText('CMD13')

    fireEvent.click(screen.getByRole('button', { name: 'Показать' }))
    await waitFor(() => {
      expect(screen.getByTestId('location')).not.toHaveTextContent('page=')
    })
  })
})

describe('лента из Redis', () => {
  const batchItem = (id: number, position: number): HandlerApiFeedBatch['items'] => [
    {
      id,
      mnemonic: `CMD${id}`,
      description: 'Команда порции ленты.',
      operand_count: 3,
      length_bits: 32,
      image_url: '',
      video_url: '',
      like_count: 0,
      position,
      is_liked: 0,
    },
  ]

  const batch = (batchNumber: number, firstPosition: number, ids: number[]): HandlerApiFeedBatch => ({
    session_id: '0f8fad5bd9cb469fa16570867728950e',
    batch_number: batchNumber,
    first_position: firstPosition,
    items: ids.flatMap((id, index) => batchItem(id, firstPosition + index) ?? []),
  })

  it('идёт по порции без запросов и загружает новую после последней команды', async () => {
    vi.mocked(api.riscvCommandsFeedBatchList)
      .mockResolvedValueOnce({ data: batch(1, 1, [7, 8]) } as never)
      .mockResolvedValueOnce({ data: batch(2, 3, [9, 10]) } as never)
    renderAt('/riscv_commands/feed')

    expect(await screen.findByText('CMD7')).toBeInTheDocument()
    expect(screen.getByText('№ 1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Следующая команда' })).toHaveAttribute(
      'href',
      '/riscv_commands/feed?id=8',
    )

    fireEvent.click(screen.getByRole('link', { name: 'Следующая команда' }))
    expect(await screen.findByText('CMD8')).toBeInTheDocument()
    expect(screen.getByText('№ 2')).toBeInTheDocument()
    expect(api.riscvCommandsFeedList).not.toHaveBeenCalled()

    // После последней команды запрашивается следующая порция, нумерация продолжается
    fireEvent.click(screen.getByRole('link', { name: 'Следующая команда' }))
    expect(await screen.findByText('CMD9')).toBeInTheDocument()
    expect(screen.getByText('№ 3')).toBeInTheDocument()
    expect(api.riscvCommandsFeedBatchList).toHaveBeenLastCalledWith({
      session_id: '0f8fad5bd9cb469fa16570867728950e',
      refresh: true,
    })
  })

  it('открывает команду по id, которой нет в порции, прежней лентой', async () => {
    vi.mocked(api.riscvCommandsFeedBatchList).mockResolvedValue({ data: batch(1, 1, [7]) } as never)
    vi.mocked(api.riscvCommandsFeedList).mockResolvedValue({
      data: {
        id: 1,
        mnemonic: 'ADD',
        description: 'Складывает значения регистров.',
        operand_count: 3,
        length_bits: 32,
        image_url: '',
        video_url: '',
        like_count: 2,
        is_liked: 0,
        next_id: 4,
      },
    } as never)
    renderAt('/riscv_commands/feed?id=1')

    expect(await screen.findByText('ADD')).toBeInTheDocument()
    expect(api.riscvCommandsFeedList).toHaveBeenCalledWith({ id: 1 })
  })
})
