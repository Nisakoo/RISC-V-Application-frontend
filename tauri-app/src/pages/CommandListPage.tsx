import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Button, ProgressBar, Spinner } from 'react-bootstrap'

import { Command, PAGE_LIMIT, getCommands } from '../api'
import { CommandCard } from '../components/CommandCard'
import { OPERAND_COUNT_MAX, OPERAND_COUNT_MIN, OperandRange, OperandRangeFilter } from '../components/OperandRangeFilter'
import { Pagination } from '../components/Pagination'
import { useCommandSearch } from '../hooks/useCommandSearch'

// Страница «Список команд»: фильтр по операндам и пагинация (на бэкенде),
// поиск похожих карточек по изображению — только среди карточек текущей страницы
export function CommandListPage() {
  const [range, setRange] = useState<OperandRange>({ min_operands: OPERAND_COUNT_MIN, max_operands: OPERAND_COUNT_MAX })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [commands, setCommands] = useState<Command[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloads, setReloads] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // В поиск передаются только команды загруженной страницы
  const { items, ready, progress, error: searchError, isSearching, searchByImage, resetSearch } =
    useCommandSearch(commands)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

  // Страница загружается при смене фильтра, номера страницы или по кнопке «Обновить»
  useEffect(() => {
    let actual = true
    setLoading(true)
    setError('')
    getCommands(range.min_operands, range.max_operands, page)
      .then((result) => {
        if (!actual) return
        setCommands(result.data)
        setTotal(result.total)
      })
      .catch((e: Error) => actual && setError(e.message))
      .finally(() => actual && setLoading(false))
    return () => {
      actual = false
    }
  }, [range, page, reloads])

  // Результат поиска относится к одной странице, поэтому при её смене сбрасывается вместе с файлом
  const clearFile = () => {
    setFile(null)
    setPreview(null)
    resetSearch()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFilter = (next: OperandRange) => {
    clearFile()
    setPage(1)
    setRange(next)
  }

  const handlePageChange = (next: number) => {
    clearFile()
    setPage(next)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0]
    if (!chosen) return
    resetSearch()
    setFile(chosen)
    setPreview(URL.createObjectURL(chosen))
  }

  return (
    <main className="page-view">
      <section className="page-content">
        <header className="page-header">
          <h1>Список команд</h1>
          <Button variant="outline-dark" size="sm" onClick={() => setReloads((count) => count + 1)}>
            Обновить
          </Button>
        </header>

        <div className="panels">
          <section className="panel" aria-label="Фильтрация">
            <OperandRangeFilter
              key={`${range.min_operands}-${range.max_operands}`}
              range={range}
              onSubmit={handleFilter}
            />
          </section>

          <section className="panel" aria-label="Поиск по изображению">
            <h2 className="panel__title">Поиск по изображению</h2>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="visually-hidden"
              onChange={handleFileChange}
            />
            <div className="panel__buttons">
              <Button variant="outline-dark" onClick={() => fileInputRef.current?.click()}>
                Выбрать файл
              </Button>
              <Button variant="riscv" onClick={() => file && searchByImage(file)} disabled={!ready || !file}>
                {ready ? 'Найти похожие' : 'Загрузка нейросети…'}
              </Button>
            </div>
            {!ready && <ProgressBar now={progress} label={`${Math.round(progress)}%`} animated />}
            <div className="panel__file">
              {preview && <img src={preview} alt="Изображение для поиска" className="preview-image" />}
              <span>{file ? file.name : 'Файл не выбран'}</span>
              {file && (
                <button type="button" className="link-button" onClick={clearFile}>
                  Сбросить
                </button>
              )}
            </div>
          </section>
        </div>

        {searchError && <p className="form-error" role="alert">{searchError}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="results-header">
          <h2>{isSearching ? 'Результаты поиска' : 'Каталог команд'}</h2>
          {isSearching ? (
            <button type="button" className="link-button" onClick={() => { setFile(null); setPreview(null); resetSearch() }}>
              Весь каталог
            </button>
          ) : (
            !loading && !error && total > 0 && <span className="results-header__meta">Найдено: {total} · страница {page} из {totalPages}</span>
          )}
        </div>

        {loading && <div className="loading-indicator"><Spinner animation="border" role="status" /></div>}

        {!loading && (
          <div className="instruction-grid">
            {items.map((command) => (
              <CommandCard key={command.id} command={command} />
            ))}
            {!error && items.length === 0 && (
              <p className="instruction-empty">
                {isSearching ? 'Похожих команд на этой странице не найдено.' : 'Для выбранного диапазона команд нет.'}
              </p>
            )}
          </div>
        )}

        <div className="d-flex justify-content-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </section>
    </main>
  )
}
