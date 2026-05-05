'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ActivitiesData } from '@/lib/types'

interface StatCardDef {
  label: string
  value: number
  unit: string
  badge: string
  variant: string
  icon: string
  bar: number
}

const SC_ICONS: Record<string, React.ReactNode> = {
  chart:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-7"/></svg>,
  globe:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V6l7-3 7 3v15"/><path d="M9 21v-6h6v6"/><path d="M9 10h.01M15 10h.01"/></svg>,
  star:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5l2.7 6.4 6.8.6-5.2 4.6 1.6 6.7L12 17.3l-5.9 3.5 1.6-6.7L2.5 9.5l6.8-.6z"/></svg>,
  cap:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v5"/></svg>,
  hands:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 12l-3-3-5 5 4 4 4-2"/><path d="M13 12l3-3 5 5-4 4-4-2"/><path d="M9 14l3 3 3-3"/></svg>,
  book:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4a2 2 0 0 1 2-2h12v17H7a2 2 0 0 0-2 2z"/><path d="M5 19a2 2 0 0 0 2 2h12"/></svg>,
  map:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3l-6 2v16l6-2 6 2 6-2V3l-6 2z"/><path d="M9 3v16M15 5v16"/></svg>,
}

const REG_DEF: Record<string, string[]> = {
  'آسيا':          ['cn','in','kz','kr','kg','tm','sg','my','mv','tw','tr','tj','jp','id','uz','pk','af','bn','bd','th','az'],
  'أوروبا':        ['fr','de','gb','es','ba','no','it','ro','xk','ru','at','by','pl','al'],
  'العالم العربي': ['sa','ae','qa','kw','om','ma','tn','dz'],
  'إفريقيا':       ['et','km','za','gn','ke','ng','ug'],
}

function StatCard({ c, idx, animate }: { c: StatCardDef; idx: number; animate: boolean }) {
  const [display, setDisplay] = useState(0)
  const [dashOffset, setDashOffset] = useState(100)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!animate) return
    const delay = 20 + idx * 45
    const baseDelay = 260 + idx * 75
    setTimeout(() => setReady(true), delay)
    setTimeout(() => {
      const t0 = performance.now(), dur = 1400
      const loop = (now: number) => {
        const p = Math.min((now - t0) / dur, 1)
        const ease = 1 - Math.pow(1 - p, 4)
        setDisplay(Math.round(ease * c.value))
        if (p < 1) requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    }, baseDelay)
    setTimeout(() => setDashOffset(Math.max(0, 100 - Math.round(c.bar))), baseDelay + 100)
  }, [animate, c.value, c.bar, idx])

  const pctVal = Math.round(c.bar)

  return (
    <div
      className={`stat-card v-${c.variant}${ready ? ' ready' : ''}`}
      style={{ ['--d' as string]: `${idx * 0.08}s` }}
    >
      <div className="sc-top">
        <span className="sc-label">{c.label}</span>
        <div className="sc-ring">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <circle className="sc-ring-bg" cx="20" cy="20" r="15.915" />
            <circle className="sc-ring-fg" cx="20" cy="20" r="15.915" style={{ strokeDashoffset: dashOffset }} />
          </svg>
          <span className="sc-icon">{SC_ICONS[c.icon]}</span>
        </div>
      </div>
      <div className="sc-num-row">
        <span className="sc-value">{display.toLocaleString('ar-EG')}</span>
        <span className="sc-unit">{c.unit}</span>
      </div>
      <div className="sc-foot">
        <span className="sc-badge"><span className="badge-arrow">↑</span>{c.badge}</span>
        <span className="sc-pct">{pctVal}%</span>
      </div>
    </div>
  )
}

export default function StatsColumn({ side }: { side: 'right' | 'left' }) {
  const t = useTranslations('stats')
  const [cards, setCards] = useState<StatCardDef[]>([])
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const { data } = (e as CustomEvent<{ data: ActivitiesData }>).detail
      const allActs = [
        ...data.countries.flatMap(c => c.activities || []),
        ...data.organizations.flatMap(o => o.activities || []),
      ]
      const total = allActs.length
      const byType: Record<string, number> = {}
      allActs.forEach(a => { byType[a.type] = (byType[a.type] || 0) + 1 })
      const cc = data.countries.length, oc = data.organizations.length
      const events   = byType['الفعاليات'] || 0
      const training = byType['التعليم_والتدريب'] || 0
      const partners = byType['الشراكات_والاتفاقيات'] || 0
      const research = byType['البحوث_العلمية_والكتب'] || 0
      const regionsCovered = Object.values(REG_DEF).filter(codes => data.countries.some(c => codes.includes(c.code))).length
      const pct = (n: number) => total > 0 ? Math.round(n / total * 100) : 0

      const rightCards: StatCardDef[] = [
        { label: t('totalActivities'), value: total, unit: t('totalActivitiesUnit'), badge: `${cc+oc} ${t('entities')}`, variant: 'blue', icon: 'chart', bar: 100 },
        { label: t('countries'), value: cc, unit: t('countriesUnit'), badge: `${regionsCovered} ${t('continents')}`, variant: 'green', icon: 'globe', bar: Math.min(cc*1.5, 100) },
        { label: t('organizations'), value: oc, unit: t('organizationsUnit'), badge: `${(cc+oc)>0 ? Math.round(oc/(cc+oc)*100) : 0}${t('ofEntities')}`, variant: 'purple', icon: 'building', bar: Math.min(oc*8, 100) },
        { label: t('events'), value: events, unit: t('eventsUnit'), badge: `${pct(events)}${t('ofTotal')}`, variant: 'orange', icon: 'star', bar: pct(events) },
      ]
      const leftCards: StatCardDef[] = [
        { label: t('education'), value: training, unit: t('educationUnit'), badge: `${pct(training)}${t('ofTotal')}`, variant: 'cyan', icon: 'cap', bar: pct(training) },
        { label: t('partnerships'), value: partners, unit: t('partnershipsUnit'), badge: `${pct(partners)}${t('ofTotal')}`, variant: 'pink', icon: 'hands', bar: pct(partners) },
        { label: t('research'), value: research, unit: t('researchUnit'), badge: `${pct(research)}${t('ofTotal')}`, variant: 'gold', icon: 'book', bar: pct(research) },
        { label: t('regions'), value: regionsCovered, unit: t('regionsUnit'), badge: t('regionsTarget'), variant: 'teal', icon: 'map', bar: (regionsCovered/4)*100 },
      ]

      setCards(side === 'right' ? rightCards : leftCards)
      setTimeout(() => setAnimate(true), 300)
    }
    document.addEventListener('globe:data', handler)
    return () => document.removeEventListener('globe:data', handler)
  }, [side, t])

  return (
    <div className={`stats-col ${side}`} id={`stats${side === 'right' ? 'Right' : 'Left'}`}>
      {cards.map((c, i) => (
        <StatCard key={c.label} c={c} idx={i} animate={animate} />
      ))}
    </div>
  )
}
