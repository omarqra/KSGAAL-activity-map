'use client'
import { create } from 'zustand'
import type { AppState, Activity } from '@/lib/types'

interface GlobeStore {
  appState: AppState
  globeReady: boolean
  spinEnabled: boolean
  userInteracting: boolean
  activeActivity: Activity | null
  activeEntityCode: string | null

  setAppState: (s: AppState) => void
  setGlobeReady: (v: boolean) => void
  setSpinEnabled: (v: boolean) => void
  setUserInteracting: (v: boolean) => void
  setActiveActivity: (a: Activity | null) => void
  setActiveEntityCode: (code: string | null) => void
}

export const useGlobeStore = create<GlobeStore>(set => ({
  appState: 'welcome',
  globeReady: false,
  spinEnabled: true,
  userInteracting: false,
  activeActivity: null,
  activeEntityCode: null,

  setAppState: s => set({ appState: s }),
  setGlobeReady: v => set({ globeReady: v }),
  setSpinEnabled: v => set({ spinEnabled: v }),
  setUserInteracting: v => set({ userInteracting: v }),
  setActiveActivity: a => set({ activeActivity: a }),
  setActiveEntityCode: code => set({ activeEntityCode: code }),
}))
