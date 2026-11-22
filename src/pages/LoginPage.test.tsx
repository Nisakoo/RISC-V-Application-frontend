import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '../api/http'
import { createAppStore } from '../store'
import { LoginPage } from './LoginPage'

vi.mock('../api/http', () => ({
  http: {
    post: vi.fn(),
  },
}))

const httpError = (status: number, message: string) =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { message } },
  })

const renderLogin = (store = createAppStore()) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/riscv_commands/feed" element={<div>Лента открыта</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

beforeEach(() => {
  localStorage.clear()
  vi.mocked(http.post).mockReset()
})

describe('страница входа', () => {
  it('выполняет вход напрямую через axios и сохраняет JWT', async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: {
        access_token: 'jwt-token',
        login: 'rv32_author',
        role: 'user',
      },
    } as never)
    const store = createAppStore()
    renderLogin(store)

    fireEvent.change(screen.getByLabelText('Логин'), { target: { value: 'rv32_author' } })
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Лента открыта')).toBeInTheDocument()
    expect(http.post).toHaveBeenCalledWith('/api/users/authentication', {
      login: 'rv32_author',
      password: 'secret123',
    })
    expect(localStorage.getItem('access_token')).toBe('jwt-token')
    expect(store.getState().user).toMatchObject({
      login: 'rv32_author',
      isAuthenticated: true,
    })
  })

  it('показывает сообщение backend при неверном пароле', async () => {
    vi.mocked(http.post).mockRejectedValue(httpError(401, 'Неверный логин или пароль.'))
    renderLogin()

    fireEvent.change(screen.getByLabelText('Логин'), { target: { value: 'rv32_author' } })
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'wrong-pass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный логин или пароль.')
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('проверяет заполнение полей до запроса', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Укажите логин и пароль.')
    expect(http.post).not.toHaveBeenCalled()
  })
})
