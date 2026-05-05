import type { ActivitiesData, Activity, EntityMeta, EntityKind } from './types'

const GOLDEN = 2.39996
const ACT_OFFSET_KM = { country: 50, org: 5 }

function offsetActivity(
  kind: EntityKind,
  code: string,
  lat: number,
  lng: number,
  idx: number,
  total: number
) {
  const r = (ACT_OFFSET_KM[kind] / 111) * Math.sqrt((idx + 0.5) / Math.max(total, 1))
  const seed = code ? code.charCodeAt(0) % 7 : 0
  const ang = idx * GOLDEN + seed
  return { lat: lat + r * Math.cos(ang), lng: lng + r * Math.sin(ang) }
}

export function buildActivities(data: ActivitiesData): Activity[] {
  const all: Activity[] = []

  const indexEntity = (
    e: { code: string; name: string; short?: string; lat: number; lng: number; activities: { name: string; type: string; subtype: string | null; date: string | null }[] },
    kind: EntityKind
  ) => {
    const acts = e.activities || []
    const meta: EntityMeta = { code: e.code, name: e.name, short: e.short || e.name, kind, lat: e.lat, lng: e.lng }
    acts.forEach((a, i) => {
      const off = offsetActivity(kind, e.code, e.lat, e.lng, i, acts.length)
      all.push({
        id: `${e.code}-${i}`,
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        date: a.date,
        lat: off.lat,
        lng: off.lng,
        entityCode: e.code,
        entityKind: kind,
        entity: meta,
      })
    })
  }

  ;(data.countries || []).forEach(c => indexEntity(c, 'country'))
  ;(data.organizations || []).forEach(o => indexEntity(o, 'org'))
  return all
}
