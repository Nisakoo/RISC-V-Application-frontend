/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RISCV_MEDIA_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
