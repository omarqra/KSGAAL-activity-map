'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useActivitiesStore } from '@/stores/activities'
import { buildActivities } from '@/lib/activities'
import type { ActivitiesData, Activity, ActivityTypeConfig, GroupBy } from '@/lib/types'

const FALLBACK_PALETTE = ['#4facfe','#4ade80','#b388ff','#ff9a44','#ff5c8d','#ffd700','#00dbde','#5ba4a4']

function yearOf(date: string | null): number | null {
  if (!date) return null
  const m = date.match(/(19|20)\d{2}/)
  return m ? parseInt(m[0], 10) : null
}

interface FlatActivity extends Activity {
  year: number | null
}

export default function ActivitiesPanel() {
  const t = useTranslations('activities')

  const {
    panelOpen, searchQuery, selectedType, selectedSubtype,
    locationFilter, yearFilter, groupBy,
    setPanelOpen, setSearchQuery, setSelectedType, setSelectedSubtype,
    setLocationFilter, setYearFilter, setGroupBy, resetFilters,
  } = useActivitiesStore()

  const [allActivities, setAllActivities] = useState<FlatActivity[]>([])
  const [typeMeta, setTypeMeta] = useState<Record<string, ActivityTypeConfig>>({})
  const [locations, setLocations] = useState<{ code: string; label: string; kind: string }[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const { data } = (e as CustomEvent<{ data: ActivitiesData; activities: Activity[] }>).detail
      const built = buildActivities(data)
      setAllActivities(built.map(a => ({ ...a, year: yearOf(a.date) })))
      setTypeMeta(data.activityTypes || {})
      setLocations([
        ...data.countries.map(c => ({ code: `c:${c.code}`, label: c.short || c.name, kind: 'country' })),
        ...data.organizations.map(o => ({ code: `o:${o.code}`, label: o.short || o.name, kind: 'org' })),
      ])
    }
    document.addEventListener('globe:data', handler)
    return () => document.removeEventListener('globe:data', handler)
  }, [])

  const typesInData = useMemo(() => [...new Set(allActivities.map(a => a.type).filter(Boolean))], [allActivities])

  const fallbackColorMap = useMemo(() => {
    const m: Record<string, string> = {}
    typesInData.forEach((tp, i) => { m[tp] = FALLBACK_PALETTE[i % FALLBACK_PALETTE.length] })
    return m
  }, [typesInData])

  const typeColor = useCallback((tp: string) => (typeMeta[tp]?.color) || fallbackColorMap[tp] || '#4facfe', [typeMeta, fallbackColorMap])
  const typeLabel = useCallback((tp: string) => (typeMeta[tp]?.label) || tp.replace(/_/g, ' '), [typeMeta])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allActivities.filter(a => {
      if (selectedType && a.type !== selectedType) return false
      if (selectedSubtype && a.subtype !== selectedSubtype) return false
      if (locationFilter) {
        const [k, code] = locationFilter.split(':')
        if (a.entity.kind !== (k === 'c' ? 'country' : 'org') || a.entity.code !== code) return false
      }
      if (yearFilter) {
        if (yearFilter === 'none') { if (a.year) return false }
        else if (a.year !== parseInt(yearFilter, 10)) return false
      }
      if (q && !(a.name || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [allActivities, searchQuery, selectedType, selectedSubtype, locationFilter, yearFilter])

  /* Type chip counts (excluding type/subtype from own filter) */
  const typeCounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const scoped = allActivities.filter(a => {
      if (locationFilter) { const [k,code]=locationFilter.split(':'); if (a.entity.kind!==(k==='c'?'country':'org')||a.entity.code!==code) return false }
      if (yearFilter) { if (yearFilter==='none'){if(a.year)return false} else if(a.year!==parseInt(yearFilter,10))return false }
      if (q&&!(a.name||'').toLowerCase().includes(q)) return false
      return true
    })
    const counts: Record<string, number> = {}
    scoped.forEach(a => { counts[a.type]=(counts[a.type]||0)+1 })
    return { counts, total: scoped.length }
  }, [allActivities, searchQuery, locationFilter, yearFilter])

  const subtypeCounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const scoped = allActivities.filter(a => {
      if (selectedType && a.type !== selectedType) return false
      if (locationFilter) { const [k,code]=locationFilter.split(':'); if (a.entity.kind!==(k==='c'?'country':'org')||a.entity.code!==code) return false }
      if (yearFilter) { if (yearFilter==='none'){if(a.year)return false} else if(a.year!==parseInt(yearFilter,10))return false }
      if (q&&!(a.name||'').toLowerCase().includes(q)) return false
      return true
    })
    const counts: Record<string, number> = {}
    scoped.forEach(a => { if (a.subtype) counts[a.subtype]=(counts[a.subtype]||0)+1 })
    return { counts, subs: Object.keys(counts) }
  }, [allActivities, searchQuery, selectedType, locationFilter, yearFilter])

  const availableYears = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const scoped = allActivities.filter(a => {
      if (selectedType && a.type !== selectedType) return false
      if (selectedSubtype && a.subtype !== selectedSubtype) return false
      if (locationFilter) { const [k,code]=locationFilter.split(':'); if (a.entity.kind!==(k==='c'?'country':'org')||a.entity.code!==code) return false }
      if (q&&!(a.name||'').toLowerCase().includes(q)) return false
      return true
    })
    const ys = new Set<number>(); let hasUndefined = false
    scoped.forEach(a => { if (a.year) ys.add(a.year); else hasUndefined = true })
    return { years: [...ys].sort((a,b)=>b-a), hasUndefined }
  }, [allActivities, searchQuery, selectedType, selectedSubtype, locationFilter])

  /* Group and render */
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ key: '', items: filtered }]
    const map = new Map<string, FlatActivity[]>()
    filtered.forEach(a => {
      let key = ''
      if (groupBy === 'year') key = a.year ? String(a.year) : 'غير محدد'
      else if (groupBy === 'entity') key = a.entity.short
      else if (groupBy === 'type') key = typeLabel(a.type)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    })
    return [...map.entries()].map(([key, items]) => ({ key, items }))
  }, [filtered, groupBy, typeLabel])

  /* Sync pin visibility */
  useEffect(() => {
    if (typeof window.setActivityFilter === 'function') {
      window.setActivityFilter(panelOpen && filtered.length < allActivities.length ? new Set(filtered.map(a => a.id)) : null)
    }
  }, [filtered, panelOpen, allActivities.length])

  const handleCardClick = (act: FlatActivity) => {
    const newId = act.id === selectedId ? null : act.id
    setSelectedId(newId)
    if (typeof window.globeFlyToActivity === 'function') window.globeFlyToActivity(act)
  }

  return (
    <aside className="act-panel" id="activitiesPanel" aria-hidden={!panelOpen}>
      <header className="ap-head">
        <div className="ap-title">
          <span className="ap-title-bar" />
          <div>
            <h2>{t('title')}</h2>
            <span className="ap-sub">{t('subtitle')}</span>
          </div>
        </div>
        <button className="ap-close" onClick={() => setPanelOpen(false)} aria-label={t('close')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div className="ap-body">
        {/* Search */}
        <div className="ap-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text" value={searchQuery} placeholder={t('searchPlaceholder')}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type chips */}
        <div className="ap-section">
          <div className="ap-section-label">{t('activityType')}</div>
          <div className="ap-chips">
            <button
              type="button"
              className={`ap-chip${!selectedType ? ' active' : ''}`}
              style={{ ['--chipActive' as string]:'rgba(79,172,254,.18)', ['--chipBorder' as string]:'rgba(79,172,254,.55)', ['--chipColor' as string]:'#4facfe' }}
              onClick={() => { setSelectedType(null); setSelectedSubtype(null) }}
            >
              جميع الأنشطة<span className="count">{typeCounts.total}</span>
            </button>
            {typesInData.map(tp => {
              const n = typeCounts.counts[tp] || 0
              if (n === 0 && selectedType !== tp) return null
              const color = typeColor(tp)
              return (
                <button
                  key={tp} type="button"
                  className={`ap-chip${selectedType === tp ? ' active' : ''}`}
                  style={{ ['--chipActive' as string]:`${color}28`, ['--chipBorder' as string]:`${color}aa`, ['--chipColor' as string]:color }}
                  onClick={() => setSelectedType(selectedType === tp ? null : tp)}
                >
                  <span className="swatch" style={{ ['--sw' as string]:color }} />
                  {typeLabel(tp)}<span className="count">{n}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Subtype chips */}
        {subtypeCounts.subs.length > 0 && (
          <div className="ap-section">
            <div className="ap-section-label">{t('subtype')}</div>
            <div className="ap-chips">
              {(() => {
                const color = selectedType ? typeColor(selectedType) : '#4facfe'
                return (
                  <>
                    <button type="button" className={`ap-chip${!selectedSubtype ? ' active' : ''}`}
                      style={{ ['--chipActive' as string]:`${color}22`, ['--chipBorder' as string]:`${color}88`, ['--chipColor' as string]:color }}
                      onClick={() => setSelectedSubtype(null)}>
                      الكل<span className="count">{Object.values(subtypeCounts.counts).reduce((s,n)=>s+n,0)}</span>
                    </button>
                    {subtypeCounts.subs.map(s => (
                      <button key={s} type="button" className={`ap-chip${selectedSubtype === s ? ' active' : ''}`}
                        style={{ ['--chipActive' as string]:`${color}22`, ['--chipBorder' as string]:`${color}88`, ['--chipColor' as string]:color }}
                        onClick={() => setSelectedSubtype(selectedSubtype === s ? null : s)}>
                        {s}<span className="count">{subtypeCounts.counts[s]}</span>
                      </button>
                    ))}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Selects */}
        <div className="ap-row">
          <div className="ap-field">
            <label>{t('location')}</label>
            <div className="ap-select">
              <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                <option value="">{t('allLocations')}</option>
                <optgroup label="الدول">
                  {locations.filter(l=>l.kind==='country').map(l=>(<option key={l.code} value={l.code}>{l.label}</option>))}
                </optgroup>
                <optgroup label="المنظمات">
                  {locations.filter(l=>l.kind==='org').map(l=>(<option key={l.code} value={l.code}>{l.label}</option>))}
                </optgroup>
              </select>
            </div>
          </div>
          <div className="ap-field">
            <label>{t('year')}</label>
            <div className="ap-select">
              <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                <option value="">{t('allYears')}</option>
                {availableYears.years.map(y=>(<option key={y} value={y}>{y}</option>))}
                {availableYears.hasUndefined && <option value="none">غير محدد</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Group by */}
        <div className="ap-section">
          <div className="ap-section-label">{t('displayMode')}</div>
          <div className="ap-segment">
            {(['none','year','entity','type'] as GroupBy[]).map(v => (
              <button key={v} type="button" className={groupBy === v ? 'active' : ''} onClick={() => setGroupBy(v)}>
                {v === 'none' ? t('noGroup') : v === 'year' ? t('byYear') : v === 'entity' ? t('byEntity') : t('byType')}
              </button>
            ))}
          </div>
        </div>

        {/* Results header */}
        <div className="ap-results-head">
          <span className="ap-results-count"><b>{filtered.length}</b> {t('matchingActivities')}</span>
          <button type="button" className="ap-reset-btn" onClick={resetFilters}>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {t('reset')}
          </button>
        </div>

        {/* List */}
        <div className="ap-list">
          {filtered.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
              <div className="ap-empty-t">{t('noResults')}</div>
              <div className="ap-empty-s">{t('noResultsSub')}</div>
            </div>
          ) : (
            groups.map(({ key, items }, gi) => (
              <div key={key || gi}>
                {groupBy !== 'none' && key && (
                  <div className="ap-group-title">
                    {key}
                    <span className="badge">{items.length}</span>
                  </div>
                )}
                {items.map((act, i) => {
                  const color = typeColor(act.type)
                  const isActive = act.id === selectedId
                  return (
                    <div
                      key={act.id}
                      className={`ap-card${isActive ? ' is-launching' : ''}`}
                      style={{ ['--accent' as string]:color, animationDelay:`${i*0.04}s` }}
                      onClick={() => handleCardClick(act)}
                      role="button" tabIndex={0}
                      onKeyDown={e => e.key==='Enter' && handleCardClick(act)}
                    >
                      <div className="ap-card-head">
                        <span className="ap-type-tag">
                          <span className="dot" />
                          {typeLabel(act.type)}
                        </span>
                        <span className="ap-entity-tag">
                          {act.entityKind === 'country'
                            ? <img className="flag" src={`https://flagcdn.com/w40/${act.entityCode}.png`} alt="" width={16} height={11} />
                            : <span className="entity-dot" />}
                          {act.entity.short}
                        </span>
                      </div>
                      <div className="ap-card-title">{act.name}</div>
                      <div className="ap-card-foot">
                        {act.date && (
                          <span className="ap-meta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            {act.date}
                          </span>
                        )}
                        {act.subtype && (
                          <span className="ap-meta subtype">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                            </svg>
                            {act.subtype}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
