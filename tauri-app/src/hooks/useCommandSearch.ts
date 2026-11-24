import { useEffect, useMemo, useRef, useState } from 'react'

import type { Command } from '../api'
import { cosineSimilarity } from '../modules/math'
import { SIMILARITY_THRESHOLD, TOP_K } from '../search_config'

// Команда списка с оценкой сходства с загруженным изображением
export interface ProcessedCommand extends Command {
  score: number
}

export const useCommandSearch = (commands: Command[]) => {
  const [embeddings, setEmbeddings] = useState<Record<number, number[]>>({})
  const [imageEmbedding, setImageEmbedding] = useState<number[] | null>(null)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const workerRef = useRef<Worker | null>(null)
  // Идентификаторы, для которых описания уже отправлены в воркер
  const requestedRef = useRef<Set<number>>(new Set())

  // 1. Воркер с моделью создаётся один раз и сразу начинает загрузку нейросети
  useEffect(() => {
    const worker = new Worker(new URL('../workers/search.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (e) => {
      const { type, data } = e.data
      switch (type) {
        case 'progress':
          if (data.status === 'progress') setProgress(data.progress)
          break
        case 'ready':
          setReady(true)
          break
        case 'text_embeddings_ready':
          setEmbeddings((previous) => ({ ...previous, ...data }))
          break
        case 'image_embedding_ready':
          setImageEmbedding(data)
          break
        case 'error':
          setError('Не удалось выполнить поиск по изображению.')
          break
      }
    }

    worker.postMessage({ type: 'init' })
    return () => worker.terminate()
  }, [])

  // 2. Эмбеддинги описаний считаются только для новых команд с английским описанием
  useEffect(() => {
    const fresh = commands.filter((command) => command.description_en && !requestedRef.current.has(command.id))
    if (fresh.length === 0) return
    fresh.forEach((command) => requestedRef.current.add(command.id))
    workerRef.current?.postMessage({
      type: 'texts',
      data: fresh.map((command) => ({ id: command.id, description_en: command.description_en })),
    })
  }, [commands])

  // 3. Ранжирование: сходство изображения с описаниями, порог, сортировка и TopK
  const items = useMemo<ProcessedCommand[]>(() => {
    if (!imageEmbedding) return commands.map((command) => ({ ...command, score: 0 }))

    return commands
      .filter((command) => embeddings[command.id])
      .map((command) => ({ ...command, score: cosineSimilarity(imageEmbedding, embeddings[command.id]) }))
      .filter((command) => command.score > SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)
  }, [commands, embeddings, imageEmbedding])

  const searchByImage = (file: File) => {
    workerRef.current?.postMessage({ type: 'image', data: file })
  }

  const resetSearch = () => setImageEmbedding(null)

  return { items, ready, progress, error, isSearching: imageEmbedding !== null, searchByImage, resetSearch }
}
