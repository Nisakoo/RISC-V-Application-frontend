import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import { api } from '../api'
import { getApiErrorMessage, isApiStatus, isBackendUnavailable } from '../modules/apiError'
import { getMockCommandFeed, getMockCommandPage } from '../modules/mock'
import {
  OperandRange,
  OPERAND_COUNT_MAX,
  OPERAND_COUNT_MIN,
  PAGE_LIMIT,
  RiscVCommandFeed,
  RiscVCommandListItem,
  RiscVCommandPage,
  toRiscVCommandFeed,
  toRiscVCommandListItem,
} from '../modules/riscvCommand'
import type { RootState } from '../store'

type ThunkConfig = {
  state: RootState
  rejectValue: string
}

export interface RiscVCommandsState {
  filters: OperandRange
  // Текущая страница плитки и общее количество команд фильтра (для пагинации)
  page: number
  total: number
  commands: RiscVCommandListItem[]
  feed: RiscVCommandFeed | null
  listLoading: boolean
  feedLoading: boolean
  listError: string | null
  feedError: string | null
  likeError: string | null
  deletingId: number | null
  likePending: boolean
}

const initialState: RiscVCommandsState = {
  filters: { min_operands: OPERAND_COUNT_MIN, max_operands: OPERAND_COUNT_MAX },
  page: 1,
  total: 0,
  commands: [],
  feed: null,
  listLoading: false,
  feedLoading: false,
  listError: null,
  feedError: null,
  likeError: null,
  deletingId: null,
  likePending: false,
}

// Плитка: фильтр и номер страницы берутся из Redux и передаются в запрос,
// а при недоступном backend гость получает страницу mock-коллекции
export const fetchCommands = createAsyncThunk<RiscVCommandPage, void, ThunkConfig>(
  'riscvCommands/fetchCommands',
  async (_, { getState, rejectWithValue }) => {
    const state = getState()
    const { filters, page } = state.riscvCommands

    try {
      const response = await api.riscvCommandsList({
        min_operands: filters.min_operands,
        max_operands: filters.max_operands,
        page,
        limit: PAGE_LIMIT,
      })
      return {
        commands: (response.data.data ?? []).map(toRiscVCommandListItem),
        total: response.data.total ?? 0,
      }
    } catch (error) {
      // Mock допустим только гостю и только если backend не ответил;
      // ответ с ошибкой (404, 5xx) показывается как есть
      if (!state.user.isAuthenticated && isBackendUnavailable(error)) {
        return getMockCommandPage(filters, page, PAGE_LIMIT)
      }
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось загрузить команды.'))
    }
  },
)

// Лента: id === null означает первую команду
export const fetchFeed = createAsyncThunk<
  RiscVCommandFeed,
  { id: number | null },
  ThunkConfig
>('riscvCommands/fetchFeed', async ({ id }, { getState, rejectWithValue }) => {
  const state = getState()

  try {
    const response = await api.riscvCommandsFeedList({
      id: id ?? undefined,
    })
    return toRiscVCommandFeed(response.data)
  } catch (error) {
    if (!state.user.isAuthenticated && isBackendUnavailable(error)) {
      try {
        return getMockCommandFeed(id)
      } catch (mockError) {
        return rejectWithValue(
          mockError instanceof Error ? mockError.message : 'Не удалось загрузить команду.',
        )
      }
    }
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось загрузить команду.'))
  }
})

export const deleteCommand = createAsyncThunk<number, number, ThunkConfig>(
  'riscvCommands/deleteCommand',
  async (id, { rejectWithValue }) => {
    try {
      await api.riscvCommandsDelete(id)
      return id
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Не удалось удалить команду.'))
    }
  },
)

export const setLike = createAsyncThunk<
  { id: number; like: 0 | 1; like_count: number },
  { id: number; like: 0 | 1 },
  ThunkConfig
>('riscvCommands/setLike', async ({ id, like }, { rejectWithValue }) => {
  try {
    const response = await api.riscvCommandsLikeCreate(id, { like })
    return {
      id,
      like: response.data.like === 1 ? 1 : 0,
      like_count: response.data.like_count ?? 0,
    }
  } catch (error) {
    if (isApiStatus(error, 401)) {
      return rejectWithValue('Требуется авторизация.')
    }
    return rejectWithValue(getApiErrorMessage(error, 'Не удалось изменить лайк.'))
  }
})

const riscvCommandsSlice = createSlice({
  name: 'riscvCommands',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<OperandRange>) {
      state.filters = action.payload
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
    resetFilters(state) {
      state.page = 1
      state.filters = { min_operands: OPERAND_COUNT_MIN, max_operands: OPERAND_COUNT_MAX }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommands.pending, (state) => {
        state.listLoading = true
        state.listError = null
      })
      .addCase(fetchCommands.fulfilled, (state, action) => {
        state.listLoading = false
        state.commands = action.payload.commands
        state.total = action.payload.total
      })
      .addCase(fetchCommands.rejected, (state, action) => {
        state.listLoading = false
        state.listError = action.payload ?? 'Не удалось загрузить команды.'
      })
      .addCase(fetchFeed.pending, (state) => {
        state.feedLoading = true
        state.feedError = null
        state.likeError = null
        state.feed = null
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.feedLoading = false
        state.feed = action.payload
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.feedLoading = false
        state.feed = null
        state.feedError = action.payload ?? 'Не удалось загрузить команду.'
      })
      .addCase(deleteCommand.pending, (state, action) => {
        state.deletingId = action.meta.arg
        state.listError = null
      })
      .addCase(deleteCommand.fulfilled, (state, action) => {
        state.deletingId = null
        state.commands = state.commands.filter((command) => command.id !== action.payload)
        if (state.feed?.riscv_command.id === action.payload) {
          state.feed = null
        }
      })
      .addCase(deleteCommand.rejected, (state, action) => {
        state.deletingId = null
        state.listError = action.payload ?? 'Не удалось удалить команду.'
      })
      .addCase(setLike.pending, (state) => {
        state.likePending = true
        state.likeError = null
      })
      .addCase(setLike.fulfilled, (state, action) => {
        state.likePending = false
        state.likeError = null
        if (state.feed && state.feed.riscv_command.id === action.payload.id) {
          state.feed = {
            ...state.feed,
            is_liked: action.payload.like,
            riscv_command: {
              ...state.feed.riscv_command,
              like_count: action.payload.like_count,
            },
          }
        }
        state.commands = state.commands.map((command) =>
          command.id === action.payload.id
            ? { ...command, like_count: action.payload.like_count }
            : command,
        )
      })
      .addCase(setLike.rejected, (state, action) => {
        state.likePending = false
        state.likeError = action.payload ?? 'Не удалось изменить лайк.'
      })
  },
})

export const { setFilters, setPage, resetFilters } = riscvCommandsSlice.actions
export default riscvCommandsSlice.reducer
