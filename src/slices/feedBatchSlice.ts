import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { api } from '../api'
import { getApiErrorMessage } from '../modules/apiError'
import { getFeedSession, setFeedSession } from '../modules/feedSession'
import { FeedBatch, FeedBatchItem, toFeedBatch } from '../modules/riscvCommand'
import { deleteCommand, setLike } from './riscvCommandsSlice'

// idle — порция ещё не запрашивалась, loading — запрос идёт,
// ready — порция в Redux, failed — backend недоступен или лента пуста (страница использует прежнюю ленту)
export type FeedBatchStatus = 'idle' | 'loading' | 'ready' | 'failed'

export interface FeedBatchState {
  status: FeedBatchStatus
  sessionId: string
  batchNumber: number
  items: FeedBatchItem[]
  // Для кого загружена порция: после входа и выхода признаки лайков перечитываются
  forAuthenticated: boolean
  error: string | null
}

const initialState: FeedBatchState = {
  status: 'idle',
  sessionId: '',
  batchNumber: 0,
  items: [],
  forAuthenticated: false,
  error: null,
}

// Порция ленты сессии: backend хранит её в Redis и отдаёт до 100 случайных команд с номерами.
// refresh = true запрашивает следующую порцию после просмотра текущей.
export const fetchFeedBatch = createAsyncThunk<
  FeedBatch,
  { refresh: boolean; authenticated: boolean },
  { state: { feedBatch: FeedBatchState }; rejectValue: string }
>('feedBatch/fetchFeedBatch', async ({ refresh }, { getState, rejectWithValue }) => {
  const sessionId = getState().feedBatch.sessionId || getFeedSession()
  try {
    const response = await api.riscvCommandsFeedBatchList({
      session_id: sessionId || undefined,
      refresh: refresh || undefined,
    })
    return toFeedBatch(response.data)
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось загрузить ленту.'))
  }
})

const feedBatchSlice = createSlice({
  name: 'feedBatch',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedBatch.pending, (state, action) => {
        state.status = 'loading'
        state.forAuthenticated = action.meta.arg.authenticated
        state.error = null
      })
      .addCase(fetchFeedBatch.fulfilled, (state, action) => {
        state.status = 'ready'
        state.sessionId = action.payload.session_id
        state.batchNumber = action.payload.batch_number
        state.items = action.payload.items
        setFeedSession(action.payload.session_id)
      })
      .addCase(fetchFeedBatch.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Не удалось загрузить ленту.'
        state.items = []
      })
      // Лайк и удаление выполняются в ленте порции без повторного запроса
      .addCase(setLike.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.riscv_command.id === action.payload.id
            ? {
                ...item,
                is_liked: action.payload.like,
                riscv_command: { ...item.riscv_command, like_count: action.payload.like_count },
              }
            : item,
        )
      })
      .addCase(deleteCommand.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.riscv_command.id !== action.payload)
      })
  },
})

export default feedBatchSlice.reducer
