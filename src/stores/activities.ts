'use client'
import { create } from 'zustand'
import type { Activity, GroupBy } from '@/lib/types'

interface ActivitiesStore {
  panelOpen: boolean
  searchQuery: string
  selectedType: string | null
  selectedSubtype: string | null
  locationFilter: string
  yearFilter: string
  groupBy: GroupBy
  selectedActivity: Activity | null

  setPanelOpen: (v: boolean) => void
  setSearchQuery: (v: string) => void
  setSelectedType: (v: string | null) => void
  setSelectedSubtype: (v: string | null) => void
  setLocationFilter: (v: string) => void
  setYearFilter: (v: string) => void
  setGroupBy: (v: GroupBy) => void
  setSelectedActivity: (a: Activity | null) => void
  resetFilters: () => void
}

export const useActivitiesStore = create<ActivitiesStore>(set => ({
  panelOpen: false,
  searchQuery: '',
  selectedType: null,
  selectedSubtype: null,
  locationFilter: '',
  yearFilter: '',
  groupBy: 'none',
  selectedActivity: null,

  setPanelOpen: v => set({ panelOpen: v }),
  setSearchQuery: v => set({ searchQuery: v }),
  setSelectedType: v => set({ selectedType: v, selectedSubtype: null }),
  setSelectedSubtype: v => set({ selectedSubtype: v }),
  setLocationFilter: v => set({ locationFilter: v }),
  setYearFilter: v => set({ yearFilter: v }),
  setGroupBy: v => set({ groupBy: v }),
  setSelectedActivity: a => set({ selectedActivity: a }),
  resetFilters: () => set({
    searchQuery: '',
    selectedType: null,
    selectedSubtype: null,
    locationFilter: '',
    yearFilter: '',
    groupBy: 'none',
    selectedActivity: null,
  }),
}))
