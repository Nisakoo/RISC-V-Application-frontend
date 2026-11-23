import { configureStore } from '@reduxjs/toolkit'

import draftReducer from './slices/draftSlice'
import feedBatchReducer from './slices/feedBatchSlice'
import riscvCommandsReducer from './slices/riscvCommandsSlice'
import userReducer from './slices/userSlice'

export const createAppStore = () =>
  configureStore({
    reducer: {
      user: userReducer,
      riscvCommands: riscvCommandsReducer,
      draft: draftReducer,
      feedBatch: feedBatchReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // В аргументе thunk создания черновика передаются File/FormData
          ignoredActionPaths: ['meta.arg'],
        },
      }),
  })

export const store = createAppStore()

export type AppStore = ReturnType<typeof createAppStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
