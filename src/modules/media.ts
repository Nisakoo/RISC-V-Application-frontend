// Изображение и видео по умолчанию лежат в самом проекте (каталог public/defaults)
export const DEFAULT_IMAGE_URL = '/defaults/image.svg'
export const DEFAULT_VIDEO_URL = '/defaults/video.mp4'

const MEDIA_BASE_URL =
  import.meta.env.VITE_RISCV_MEDIA_BASE_URL ?? 'http://localhost:9000/riscv-assets'

// Строит публичный URL объекта MinIO по ключу; пустой ключ даёт пустой URL
export const mediaURL = (key: string): string => (key ? `${MEDIA_BASE_URL}/${key}` : '')
