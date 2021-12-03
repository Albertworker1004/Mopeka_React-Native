export type Toast = {
  type: 'success' | 'info' | 'warning' | 'error'
  title?: string
  message: string
  timestamp?: number
}

export type ToastState = {
  toasts: Toast[]
}
