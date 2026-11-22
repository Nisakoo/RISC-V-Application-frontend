import { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'

import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMediaFallback } from '../hooks/useMediaFallback'
import { useAppDispatch, useAppSelector } from '../hooks/store'
import { DEFAULT_IMAGE_URL, DEFAULT_VIDEO_URL } from '../modules/media'
import { COMMAND_LENGTH_OPTIONS, OPERAND_COUNT_MAX, OPERAND_COUNT_MIN } from '../modules/riscvCommand'
import {
  clearDraftError,
  createDraft,
  fetchDraft,
  publishDraft,
  resetDraft,
  setDraftForm,
} from '../slices/draftSlice'
import { ROUTES } from '../Routes'

const OPERAND_COUNTS = Array.from(
  { length: OPERAND_COUNT_MAX - OPERAND_COUNT_MIN + 1 },
  (_, index) => OPERAND_COUNT_MIN + index,
)

// Страница добавления: сначала создаётся черновик с файлами, затем он публикуется
export const RiscVCommandAddPage: FC = () => {
  useDocumentTitle('Добавление команды · RISC-V')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const { draft, form, loaded, loading, error } = useAppSelector((state) => state.draft)

  const [image, setImage] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [validationError, setValidationError] = useState('')

  const draftImage = useMediaFallback(draft?.image_url ?? '', DEFAULT_IMAGE_URL)
  const draftVideo = useMediaFallback(draft?.video_url ?? '', DEFAULT_VIDEO_URL)

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchDraft())
    }
  }, [dispatch, isAuthenticated])

  // Гость не может открыть страницу добавления
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  const showError = validationError || error

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImage(event.target.files?.[0] ?? null)
    setValidationError('')
  }

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVideo(event.target.files?.[0] ?? null)
    setValidationError('')
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.mnemonic.trim()) {
      setValidationError('Укажите мнемонику команды.')
      return
    }
    if (!image || !video) {
      setValidationError('Выберите изображение и короткое видео.')
      return
    }

    try {
      await dispatch(
        createDraft({ mnemonic: form.mnemonic.trim(), image, video }),
      ).unwrap()
      setImage(null)
      setVideo(null)
      setValidationError('')
    } catch {
      // Сообщение backend уже записано в состояние draft.error
    }
  }

  const handlePublish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) return

    const description = form.description.trim()
    if (description.length < 10 || description.length > 1000) {
      setValidationError('Описание должно содержать от 10 до 1000 символов.')
      return
    }
    if (form.operandCount < OPERAND_COUNT_MIN || form.operandCount > OPERAND_COUNT_MAX) {
      setValidationError('Количество операндов должно быть от 0 до 3.')
      return
    }
    if (!COMMAND_LENGTH_OPTIONS.includes(form.lengthBits as (typeof COMMAND_LENGTH_OPTIONS)[number])) {
      setValidationError('Длина команды должна равняться 16, 32, 48 или 64 битам.')
      return
    }

    try {
      await dispatch(
        publishDraft({
          id: draft.id,
          description,
          operandCount: form.operandCount,
          lengthBits: form.lengthBits,
        }),
      ).unwrap()
      dispatch(resetDraft())
      navigate(ROUTES.GRID, { replace: true })
    } catch {
      // Сообщение backend уже записано в состояние draft.error
    }
  }

  return (
    <main className="page-view plain-page">
      <section className="page-content add-page" aria-busy={loading}>
        <h1>Добавление команды</h1>

        {showError && (
          <Alert
            variant="danger"
            className="form-error"
            role="alert"
            onClose={() => {
              setValidationError('')
              if (error) dispatch(clearDraftError())
            }}
            dismissible
          >
            {showError}
          </Alert>
        )}

        {!draft && loaded && (
          <Form className="add-form" onSubmit={handleCreate} noValidate>
            <p className="add-page__hint">
              Создайте черновик: укажите мнемонику, изображение и короткое видео.
            </p>

            <Form.Group controlId="draft-mnemonic" className="auth-form__field">
              <Form.Label>Мнемоника</Form.Label>
              <Form.Control
                value={form.mnemonic}
                onChange={(event) => dispatch(setDraftForm({ mnemonic: event.target.value }))}
                placeholder="Например, XORI"
                disabled={loading}
                required
              />
            </Form.Group>

            <Form.Group controlId="draft-image" className="auth-form__field">
              <Form.Label>Изображение</Form.Label>
              <Form.Control
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                disabled={loading}
                required
              />
              <Form.Text>PNG, JPEG или WebP до 5 МиБ.</Form.Text>
            </Form.Group>

            <Form.Group controlId="draft-video" className="auth-form__field">
              <Form.Label>Короткое видео</Form.Label>
              <Form.Control
                type="file"
                accept="video/mp4"
                onChange={handleVideoChange}
                disabled={loading}
                required
              />
              <Form.Text>MP4 до 50 МиБ.</Form.Text>
            </Form.Group>

            <Button type="submit" variant="riscv" className="primary-action" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" aria-hidden="true" /> Создаём…
                </>
              ) : (
                'Создать черновик'
              )}
            </Button>
          </Form>
        )}

        {draft && (
          <div className="draft-panel">
            <div className="draft-panel__media">
              <img
                className="draft-panel__image"
                src={draftImage.source}
                onError={draftImage.handleError}
                alt={`Схема команды ${draft.mnemonic}`}
              />
              <video
                className="draft-panel__video"
                src={draftVideo.source}
                onError={draftVideo.handleError}
                controls
                muted
                playsInline
                preload="metadata"
              >
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
            </div>

            <p className="draft-panel__title">
              Черновик команды <strong>{draft.mnemonic}</strong>
            </p>

            <Form className="add-form" onSubmit={handlePublish} noValidate>
              <Form.Group controlId="draft-description" className="auth-form__field">
                <Form.Label>Описание</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={form.description}
                  onChange={(event) => dispatch(setDraftForm({ description: event.target.value }))}
                  placeholder="Опишите назначение команды RISC-V"
                  disabled={loading}
                  required
                />
                <Form.Text>От 10 до 1000 символов.</Form.Text>
              </Form.Group>

              <Form.Group controlId="draft-operands" className="auth-form__field">
                <Form.Label>Количество операндов</Form.Label>
                <Form.Select
                  value={form.operandCount}
                  onChange={(event) =>
                    dispatch(setDraftForm({ operandCount: Number(event.target.value) }))
                  }
                  disabled={loading}
                >
                  {OPERAND_COUNTS.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="draft-length" className="auth-form__field">
                <Form.Label>Длина команды, бит</Form.Label>
                <Form.Select
                  value={form.lengthBits}
                  onChange={(event) =>
                    dispatch(setDraftForm({ lengthBits: Number(event.target.value) }))
                  }
                  disabled={loading}
                >
                  {COMMAND_LENGTH_OPTIONS.map((length) => (
                    <option key={length} value={length}>
                      {length}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button type="submit" variant="riscv" className="primary-action" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" aria-hidden="true" /> Публикуем…
                  </>
                ) : (
                  'Опубликовать'
                )}
              </Button>
            </Form>
          </div>
        )}
      </section>
    </main>
  )
}
