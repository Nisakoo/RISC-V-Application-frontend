import { useEffect } from 'react'

// Заголовок вкладки браузера, как у SSR-страниц backend
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    document.title = title
  }, [title])
}
