import {
  env,
  AutoTokenizer,
  AutoProcessor,
  SiglipTextModel,
  SiglipVisionModel,
  RawImage,
} from '@huggingface/transformers'

// Модель скачивается с Hugging Face при первом запуске и кешируется
env.allowLocalModels = false
env.allowRemoteModels = true

const MODEL_ID = 'Xenova/siglip-base-patch16-224'

// Singleton: модели загружаются один раз. Запрос init хранится как promise,
// чтобы одновременные сообщения не начинали загрузку повторно.
class SiglipService {
  static tokenizer: any = null
  static processor: any = null
  static textModel: any = null
  static visionModel: any = null
  static loading: Promise<void> | null = null

  static init(progress_callback?: (data: any) => void): Promise<void> {
    if (!this.loading) {
      this.loading = (async () => {
        // q8 — квантизованная модель: баланс качества и скорости на CPU (WASM)
        const options = { device: 'wasm', dtype: 'q8' } as const

        this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback })
        this.processor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback })
        this.textModel = await SiglipTextModel.from_pretrained(MODEL_ID, { ...options, progress_callback })
        this.visionModel = await SiglipVisionModel.from_pretrained(MODEL_ID, { ...options, progress_callback })
      })()
    }
    return this.loading
  }
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, data } = event.data

  try {
    // Загрузка нейросети
    if (type === 'init') {
      await SiglipService.init((msg) => {
        self.postMessage({ type: 'progress', data: msg })
      })
      self.postMessage({ type: 'ready' })
    }

    // Эмбеддинги английских описаний: все описания разом
    if (type === 'texts') {
      await SiglipService.init()
      const items: { id: number; description_en: string }[] = data
      const embeddings: Record<number, number[]> = {}

      const text_inputs = await SiglipService.tokenizer(
        items.map((item) => item.description_en),
        // max_length нужен для одинаковой длины
        { padding: 'max_length', truncation: true },
      )
      const { pooler_output: textOutput } = await SiglipService.textModel(text_inputs)

      const embeddingSize = textOutput.dims[1]
      for (let i = 0; i < items.length; i++) {
        const textVector = textOutput.data.slice(i * embeddingSize, (i + 1) * embeddingSize)
        embeddings[items[i].id] = Array.from(textVector as ArrayLike<number>)
      }

      self.postMessage({ type: 'text_embeddings_ready', data: embeddings })
    }

    // Эмбеддинг загруженного изображения
    if (type === 'image') {
      await SiglipService.init()
      const imageUrl = URL.createObjectURL(data)
      // RawImage нужен, чтобы процессор не принял картинку за текст
      const image = await RawImage.read(imageUrl)
      const imageInputs = await SiglipService.processor(image)
      const { pooler_output } = await SiglipService.visionModel(imageInputs)

      self.postMessage({ type: 'image_embedding_ready', data: Array.from(pooler_output.data as ArrayLike<number>) })
      URL.revokeObjectURL(imageUrl)
    }
  } catch (error) {
    console.error(error)
    self.postMessage({ type: 'error', data: String(error) })
  }
})
