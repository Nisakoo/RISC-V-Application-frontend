import { configureStore } from '@reduxjs/toolkit'

import draftReducer from './slices/draftSlice'
import riscvCommandsReducer from './slices/riscvCommandsSlice'
import userReducer from './slices/userSlice'

export const createAppStore = () =>
  configureStore({
    reducer: {
      user: userReducer,
      riscvCommands: riscvCommandsReducer,
      draft: draftReducer,
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
