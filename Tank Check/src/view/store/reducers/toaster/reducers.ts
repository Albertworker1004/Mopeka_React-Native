import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppThunk } from '..'
import { ToastState, Toast } from './types'

const initialState: ToastState = {
  toasts: [],
}

const toasterSlice = createSlice({
  name: 'toaster',
  initialState,
  reducers: {
    clearAllToasts(state) {
      state.toasts = []
    },
    createToast(state, action: PayloadAction<Toast>) {
      state.toasts.push(action.payload)
      setTimeout(() => {}, 3000)
    },
    removeToast(state, action: PayloadAction<Toast>) {
      const index = state.toasts.findIndex(toast => toast.timestamp === action.payload.timestamp)
      state.toasts.splice(index, 1)
    },
  },
})

export const { clearAllToasts, createToast, removeToast } = toasterSlice.actions

export default toasterSlice.reducer

export const showToast = (toast: Toast, timeout: number = 3500): AppThunk => async dispatch => {
  toast.timestamp = Date.now()
  dispatch(createToast(toast))
  setTimeout(() => {
    dispatch(removeToast(toast))
  }, timeout)
}
