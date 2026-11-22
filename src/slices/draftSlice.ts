import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import { api } from '../api'
import { getApiErrorMessage, isApiStatus } from '../modules/apiError'
import { RiscVCommand, toRiscVCommand } from '../modules/riscvCommand'
import type { RootState } from '../store'

type ThunkConfig = {
  state: RootState
  rejectValue: string
}

export interface DraftForm {
  mnemonic: string
  description: string
  operandCount: number
  lengthBits: number
}

export interface DraftState {
  draft: RiscVCommand | null
  form: DraftForm
  loaded: boolean
  loading: boolean
  error: string | null
}

const emptyForm: DraftForm = {
  mnemonic: '',
  description: '',
  operandCount: 0,
  lengthBits: 32,
}

// Форма публикации заполняется из команды; длина по умолчанию — 32 бита
const toForm = (command: RiscVCommand): DraftForm => ({
  mnemonic: command.mnemonic,
  description: command.description,
  operandCount: command.operand_count,
  lengthBits: command.length_bits || emptyForm.lengthBits,
})

const initialState: DraftState = {
  draft: null,
  form: emptyForm,
  loaded: false,
  loading: false,
  error: null,
}

// Черновик у пользователя не более одного; 404 означает, что его ещё нет
export const fetchDraft = createAsyncThunk<RiscVCommand | null, void, ThunkConfig>(
  'draft/fetchDraft',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.riscvCommandsDraftList()
      return toRiscVCommand(response.data)
    } catch (error) {
      if (isApiStatus(error, 404)) return null
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось загрузить черновик.'))
    }
  },
)

export const createDraft = createAsyncThunk<
  RiscVCommand,
  { mnemonic: string; image: File; video: File },
  ThunkConfig
>('draft/createDraft', async (input, { rejectWithValue }) => {
  try {
    const response = await api.riscvCommandsCreate(input)
    return toRiscVCommand(response.data)
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось создать черновик.'))
  }
})

export const publishDraft = createAsyncThunk<
  RiscVCommand,
  { id: number; description: string; operandCount: number; lengthBits: number },
  ThunkConfig
>('draft/publishDraft', async ({ id, description, operandCount, lengthBits }, { rejectWithValue }) => {
  try {
    const response = await api.riscvCommandsPublishUpdate(id, {
      description,
      operand_count: operandCount,
      length_bits: lengthBits,
    })
    return toRiscVCommand(response.data)
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось опубликовать команду.'))
  }
})

const draftSlice = createSlice({
  name: 'draft',
  initialState,
  reducers: {
    setDraftForm(state, action: PayloadAction<Partial<DraftForm>>) {
      state.form = { ...state.form, ...action.payload }
    },
    resetDraft(state) {
      state.draft = null
      state.form = emptyForm
      state.loaded = false
      state.loading = false
      state.error = null
    },
    clearDraftError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDraft.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDraft.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.draft = action.payload
        state.form = action.payload ? toForm(action.payload) : emptyForm
      })
      .addCase(fetchDraft.rejected, (state, action) => {
        state.loading = false
        state.loaded = true
        state.error = action.payload ?? 'Не удалось загрузить черновик.'
      })
      .addCase(createDraft.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createDraft.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.draft = action.payload
        state.form = toForm(action.payload)
      })
      .addCase(createDraft.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Не удалось создать черновик.'
      })
      .addCase(publishDraft.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(publishDraft.fulfilled, (state, action) => {
        state.loading = false
        state.draft = action.payload
        state.form = toForm(action.payload)
      })
      .addCase(publishDraft.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Не удалось опубликовать команду.'
      })
  },
})

export const { setDraftForm, resetDraft, clearDraftError } = draftSlice.actions
export default draftSlice.reducer
