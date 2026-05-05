export interface ActivityRaw {
  name: string
  type: string
  subtype: string | null
  date: string | null
}

export interface CountryRaw {
  code: string
  name: string
  short?: string
  en?: string
  capital?: string
  lat: number
  lng: number
  hasDetailedMap?: boolean
  activities: ActivityRaw[]
}

export interface OrganizationRaw {
  code: string
  name: string
  short?: string
  en?: string
  city?: string
  country?: string
  lat: number
  lng: number
  activities: ActivityRaw[]
}

export interface ActivityTypeConfig {
  color: string
  label: string
}

export interface ActivitiesData {
  meta: { source: string; date: string; sector: string }
  activityTypes: Record<string, ActivityTypeConfig>
  countries: CountryRaw[]
  organizations: OrganizationRaw[]
  _activities?: Activity[]
}

export type EntityKind = 'country' | 'org'

export interface EntityMeta {
  code: string
  name: string
  short: string
  kind: EntityKind
  lat: number
  lng: number
}

export interface Activity {
  id: string
  name: string
  type: string
  subtype: string | null
  date: string | null
  lat: number
  lng: number
  entityCode: string
  entityKind: EntityKind
  entity: EntityMeta
}

export type AppState = 'welcome' | 'trans_fwd' | 'globe'
export type GroupBy = 'none' | 'year' | 'entity' | 'type'
export type Locale = 'ar' | 'en'
