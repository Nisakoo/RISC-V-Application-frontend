import { useState } from 'react'

import { normalizeMediaUrl } from '../modules/media'

// Возвращает адрес медиа и обработчик ошибки загрузки: при пустом URL
// или недоступном объекте используется файл по умолчанию из проекта
export const useMediaFallback = (url: string, defaultURL: string) => {
  const normalizedURL = normalizeMediaUrl(url)
  const source = normalizedURL || defaultURL
  const [failedSource, setFailedSource] = useState<string>()

  return {
    source: source === failedSource ? defaultURL : source,
    handleError: () => setFailedSource(source),
  }
}
