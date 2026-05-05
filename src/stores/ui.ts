'use client'
import { create } from 'zustand'
import type { Locale } from '@/lib/types'

interface UIStore {
  locale: Locale
  setLocale: (l: Locale) => void
}

export const useUIStore = create<UIStore>(set => ({
  locale: 'ar',
  setLocale: l => set({ locale: l }),
}))
