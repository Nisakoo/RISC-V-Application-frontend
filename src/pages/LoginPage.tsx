import { ChangeEvent, FC, FormEvent, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'

import { signIn } from '../api/auth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAppDispatch, useAppSelector } from '../hooks/store'
import { getApiErrorMessage } from '../modules/apiError'
import { setAccessToken } from '../modules/authStorage'
import { clearAuthError, setAuthError, setAuthPending, setUser } from '../slices/userSlice'
import { ROUTES } from '../Routes'

// Страница входа: по методичке запрос выполняется только через axios (api/auth),
// без кодогенерации и без createAsyncThunk
export const LoginPage: FC = () => {
  useDocumentTitle('Вход · RISC-V')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, error, pending: isSubmitting } = useAppSelector((state) => state.user)

  const [formData, setFormData] = useState({ login: '', password: '' })

  if (isAuthenticated) {
    return <Navigate to={ROUTES.FEED} replace />
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (error) dispatch(clearAuthError())
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formData.login.trim() || !formData.password) {
      dispatch(setAuthError('Укажите логин и пароль.'))
      return
    }

    dispatch(setAuthPending(true))
    try {
      const { access_token: accessToken, login, role } = await signIn(
        formData.login.trim(),
        formData.password,
      )
      if (!accessToken) {
        dispatch(setAuthError('Сервер не вернул токен доступа.'))
        return
      }

      setAccessToken(accessToken)
      dispatch(
        setUser({
          login: login || formData.login.trim(),
          role: role === 'moderator' ? 'moderator' : 'user',
        }),
      )
      navigate(ROUTES.FEED, { replace: true })
    } catch (requestError) {
      dispatch(setAuthError(getApiErrorMessage(requestError, 'Не удалось выполнить вход.')))
    } finally {
      dispatch(setAuthPending(false))
    }
  }

  return (
    <main className="page-view plain-page">
      <section className="page-content auth-page">
        <h1>Вход</h1>
        <p className="auth-page__hint">Войдите, чтобы добавлять команды и ставить лайки.</p>

        {error && (
          <Alert variant="danger" className="form-error" role="alert">
            {error}
          </Alert>
        )}

        <Form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Form.Group controlId="login" className="auth-form__field">
            <Form.Label>Логин</Form.Label>
            <Form.Control
              name="login"
              value={formData.login}
              onChange={handleChange}
              autoComplete="username"
              placeholder="Например, rv32_author"
              disabled={isSubmitting}
              required
            />
          </Form.Group>

          <Form.Group controlId="password" className="auth-form__field">
            <Form.Label>Пароль</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Введите пароль"
              disabled={isSubmitting}
              required
            />
          </Form.Group>

          <Button type="submit" variant="riscv" className="primary-action" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" aria-hidden="true" /> Входим…
              </>
            ) : (
              'Войти'
            )}
          </Button>
        </Form>
      </section>
    </main>
  )
}
