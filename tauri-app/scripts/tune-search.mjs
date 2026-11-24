// Подбор порога и TopK: считает косинусное сходство изображений команд (backend/assets/images)
// с английскими описаниями из БД и выводит таблицу. Запуск: npm run tune-search
// Требуется запущенный backend (описания берутся из API).
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { AutoProcessor, AutoTokenizer, RawImage, SiglipTextModel, SiglipVisionModel } from '@huggingface/transformers'

const MODEL_ID = 'Xenova/siglip-base-patch16-224'
const imagesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../backend/assets/images')
const apiUrl = process.env.API_URL ?? 'http://localhost:8080'

const cosine = (a, b) => {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

const page = await (await fetch(`${apiUrl}/api/riscv_commands?limit=100`)).json()
// DESCRIPTIONS_FILE: JSON { "ADD": "описание" } подменяет описания из БД при подборе формулировок
const overrides = process.env.DESCRIPTIONS_FILE ? JSON.parse(await readFile(process.env.DESCRIPTIONS_FILE, 'utf8')) : {}
const commands = page.data
  .map((command) => ({ ...command, description_en: overrides[command.mnemonic] ?? command.description_en }))
  .filter((command) => command.description_en)

const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID)
const processor = await AutoProcessor.from_pretrained(MODEL_ID)
const textModel = await SiglipTextModel.from_pretrained(MODEL_ID, { dtype: 'q8' })
const visionModel = await SiglipVisionModel.from_pretrained(MODEL_ID, { dtype: 'q8' })

const textInputs = await tokenizer(commands.map((command) => command.description_en), { padding: 'max_length', truncation: true })
const { pooler_output: textOutput } = await textModel(textInputs)
const size = textOutput.dims[1]
const textVectors = commands.map((_, i) => Array.from(textOutput.data.slice(i * size, (i + 1) * size)))

console.log('Запрос (изображение) -> сходство с каждой командой, по убыванию')
for (const query of commands) {
  const bytes = await readFile(resolve(imagesDir, `${query.mnemonic}.png`)).catch(() => null)
  if (!bytes) continue
  const image = await RawImage.fromBlob(new Blob([bytes]))
  const { pooler_output } = await visionModel(await processor(image))
  const scores = commands
    .map((command, i) => ({ mnemonic: command.mnemonic, score: cosine(Array.from(pooler_output.data), textVectors[i]) }))
    .sort((a, b) => b.score - a.score)
  console.log(`${query.mnemonic.padEnd(5)} -> ${scores.map((s) => `${s.mnemonic} ${s.score.toFixed(3)}`).join(' | ')}`)
}
