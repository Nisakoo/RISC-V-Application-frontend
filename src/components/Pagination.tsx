import { FC } from 'react'
import { Pagination as BootstrapPagination } from 'react-bootstrap'

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

// Количество страниц по обе стороны от текущей: при тысячах страниц список номеров не разрастается
const SIBLINGS = 2

// Номера страниц для показа; null обозначает пропуск между первой/последней и окном вокруг текущей
const visiblePages = (currentPage: number, totalPages: number): (number | null)[] => {
  const pages: (number | null)[] = []
  let from = Math.max(2, currentPage - SIBLINGS)
  let to = Math.min(totalPages - 1, currentPage + SIBLINGS)
  // Многоточие вместо единственной страницы бессмысленно: показываем саму страницу
  if (from === 3) from = 2
  if (to === totalPages - 2) to = totalPages - 1
  pages.push(1)
  if (from > 2) pages.push(null)
  for (let page = from; page <= to; page += 1) pages.push(page)
  if (to < totalPages - 1) pages.push(null)
  if (totalPages > 1) pages.push(totalPages)
  return pages
}

// Пагинация плитки: первая, предыдущая, окно номеров, следующая и последняя страницы
export const Pagination: FC<Props> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  return (
    <BootstrapPagination className="riscv-pagination" aria-label="Страницы команд">
      <BootstrapPagination.First
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="Первая страница"
      />
      <BootstrapPagination.Prev
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Предыдущая страница"
      />
      {visiblePages(currentPage, totalPages).map((page, index) =>
        page === null ? (
          <BootstrapPagination.Ellipsis key={`gap-${index}`} disabled />
        ) : (
          <BootstrapPagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </BootstrapPagination.Item>
        ),
      )}
      <BootstrapPagination.Next
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Следующая страница"
      />
      <BootstrapPagination.Last
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Последняя страница"
      />
    </BootstrapPagination>
  )
}
