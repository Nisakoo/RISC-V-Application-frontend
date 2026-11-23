import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Pagination } from './Pagination'

// Номера и многоточия в порядке отображения (кнопки перехода не учитываются)
const shownPages = () =>
  screen
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '')
    .filter((text) => /^\d/.test(text) || text.startsWith('…'))
    // У активной страницы React-Bootstrap добавляет скрытую подпись «(current)»
    .map((text) => (text.startsWith('…') ? '…' : text.replace(/\D.*$/, '')))

describe('пагинация', () => {
  it('не заменяет многоточием единственную пропущенную страницу', () => {
    render(<Pagination currentPage={5} totalPages={8085} onPageChange={() => undefined} />)
    expect(shownPages()).toEqual(['1', '2', '3', '4', '5', '6', '7', '…', '8085'])
  })

  it('скрывает многоточием несколько страниц с обеих сторон', () => {
    render(<Pagination currentPage={50} totalPages={100} onPageChange={() => undefined} />)
    expect(shownPages()).toEqual(['1', '…', '48', '49', '50', '51', '52', '…', '100'])
  })

  it('показывает предпоследнюю страницу вместо многоточия', () => {
    render(<Pagination currentPage={96} totalPages={100} onPageChange={() => undefined} />)
    expect(shownPages()).toEqual(['1', '…', '94', '95', '96', '97', '98', '99', '100'])
  })
})
