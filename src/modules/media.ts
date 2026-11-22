// Изображение и видео по умолчанию лежат в самом проекте (каталог public/defaults)
export const DEFAULT_IMAGE_URL = `${import.meta.env.BASE_URL}defaults/image.svg`
export const DEFAULT_VIDEO_URL = `${import.meta.env.BASE_URL}defaults/video.mp4`

// В dev-режиме медиа из MinIO идут через прокси Vite, чтобы не зависеть от CORS
const MINIO_ORIGIN = import.meta.env.VITE_MEDIA_ORIGIN || 'http://localhost:9000'

export const normalizeMediaUrl = (url: string): string => {
  if (!url) return url
  return url.startsWith(MINIO_ORIGIN) ? url.slice(MINIO_ORIGIN.length) : url
}
