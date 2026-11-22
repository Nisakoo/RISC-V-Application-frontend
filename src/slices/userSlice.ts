import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type UserRole = 'user' | 'moderator'

export interface UserState {
  login: string
  role: UserRole | ''
  isAuthenticated: boolean
  // Идёт запрос входа или выхода: интерфейс блокируется оверлеем
  pending: boolean
  error: string | null
}

const initialState: UserState = {
  login: '',
  role: '',
  isAuthenticated: false,
  pending: false,
  error: null,
}

interface UserPayload {
  login: string
  role: UserRole
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Авторизация и деавторизация выполняются через axios в компонентах,
    // поэтому состояние меняется обычными действиями без createAsyncThunk
    setUser(state, action: PayloadAction<UserPayload>) {
      state.login = action.payload.login
      state.role = action.payload.role
      state.isAuthenticated = true
      state.error = null
    },
    clearUser(state) {
      state.login = ''
      state.role = ''
      state.isAuthenticated = false
      state.error = null
    },
    setAuthPending(state, action: PayloadAction<boolean>) {
      state.pending = action.payload
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload
    },
    clearAuthError(state) {
      state.error = null
    },
  },
})

export const { setUser, clearUser, setAuthPending, setAuthError, clearAuthError } = userSlice.actions
export default userSlice.reducer
