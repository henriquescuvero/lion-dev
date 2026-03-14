import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

let toastCounter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message, duration = 3000) => {
    const id = `toast-${++toastCounter}`
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }))

    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

// Convenience functions
export const toast = {
  success: (message: string, duration?: number) => useToastStore.getState().addToast('success', message, duration),
  error: (message: string, duration?: number) => useToastStore.getState().addToast('error', message, duration ?? 5000),
  info: (message: string, duration?: number) => useToastStore.getState().addToast('info', message, duration),
  warning: (message: string, duration?: number) => useToastStore.getState().addToast('warning', message, duration ?? 4000),
}
