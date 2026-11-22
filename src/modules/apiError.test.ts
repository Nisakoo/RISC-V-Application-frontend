import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'

import { isBackendUnavailable } from './apiError'

describe('isBackendUnavailable', () => {
  it('считает недоступным backend, который не ответил', () => {
    expect(isBackendUnavailable(new AxiosError('Network Error'))).toBe(true)
  })

  it('не считает недоступным backend, который ответил ошибкой', () => {
    const error = new AxiosError('Not Found', '404', undefined, undefined, {
      status: 404,
    } as never)
    expect(isBackendUnavailable(error)).toBe(false)
  })
})
