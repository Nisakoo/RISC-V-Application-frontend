import { useState } from 'react'

// Возвращает адрес медиа и обработчик ошибки загрузки: при пустом URL
// или недоступном объекте используется файл по умолчанию из проекта
export const useMediaFallback = (url: string, defaultURL: string) => {
  const source = url || defaultURL
  const [failedSource, setFailedSource] = useState<string>()

  return {
    source: source === failedSource ? defaultURL : source,
    handleError: () => setFailedSource(source),
  }
}
