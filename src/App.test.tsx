import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './App'
import { DEFAULT_IMAGE_URL, DEFAULT_VIDEO_URL } from './modules/media'

// Показывает текущий адрес, чтобы проверять сохранение фильтра в URL
const LocationProbe = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <AppRoutes />
      <LocationProbe />
    </MemoryRouter>,
  )

describe('нижняя навигация', () => {
  it('содержит четыре пункта, из которых доступны лента и плитка', async () => {
    renderAt('/riscv_commands/grid')
    const navigation = await screen.findByRole('navigation', { name: 'Основная навигация' })
    const items = within(navigation).getAllByText(/Лента|Добавить|Плитка|Вход/)
    expect(items.map((item) => item.textContent)).toEqual(['Лента', 'Добавить', 'Плитка', 'Вход'])

    expect(within(navigation).getByRole('link', { name: 'Лента' })).toHaveAttribute(
      'href',
      '/riscv_commands/feed',
    )
    expect(within(navigation).getByRole('link', { name: 'Плитка' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(navigation).queryByRole('link', { name: 'Добавить' })).not.toBeInTheDocument()
    expect(within(navigation).queryByRole('link', { name: 'Вход' })).not.toBeInTheDocument()
    expect(within(navigation).getByText('Вход').closest('.disabled')).toBeInTheDocument()
  })

  it('перенаправляет корневой адрес на ленту', async () => {
    renderAt('/')
    expect(await screen.findByText('ADD')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/riscv_commands/feed')
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

  it('подставляет изображение по умолчанию для пустого и недоступного URL', async () => {
    renderAt('/riscv_commands/grid')
    const emptyImage = await screen.findByAltText('Схема команды XOR')
    expect(emptyImage).toHaveAttribute('src', DEFAULT_IMAGE_URL)

    const unavailableImage = screen.getByAltText('Схема команды ADD')
    expect(unavailableImage.getAttribute('src')).toMatch(/images\/ADD\.png$/)
    fireEvent.error(unavailableImage)
    expect(unavailableImage).toHaveAttribute('src', DEFAULT_IMAGE_URL)
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

  it('использует видео по умолчанию для команды без видео', async () => {
    const { container } = renderAt('/riscv_commands/feed?id=64')
    await screen.findByText('ECALL')
    const video = container.querySelector('video')
    expect(video).toHaveAttribute('src', DEFAULT_VIDEO_URL)
    expect(video).toHaveAttribute('poster', DEFAULT_IMAGE_URL)
  })

  it('подставляет постер по умолчанию, если изображение команды недоступно', async () => {
    const { container } = renderAt('/riscv_commands/feed?id=1')
    await screen.findByText('ADD')
    const video = container.querySelector('video')
    expect(video?.getAttribute('poster')).toMatch(/images\/ADD\.png$/)

    const posterCheck = container.querySelector('img[aria-hidden="true"]')
    expect(posterCheck).not.toBeNull()
    fireEvent.error(posterCheck!)
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
})
