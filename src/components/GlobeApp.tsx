'use client'
import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useGlobeStore } from '@/stores/globe'
import { useActivitiesStore } from '@/stores/activities'

const WelcomeScene  = dynamic(() => import('./welcome/WelcomeScene'),  { ssr: false })
const GlobeMap      = dynamic(() => import('./globe/GlobeMap'),        { ssr: false })
const StatsColumn   = dynamic(() => import('./stats/StatsColumn'),     { ssr: false })
const ActivitiesPanel = dynamic(() => import('./activities/ActivitiesPanel'), { ssr: false })
const LanguageSwitcher = dynamic(() => import('./ui/LanguageSwitcher'), { ssr: false })

export function GlobeApp() {
  const t = useTranslations()
  const appState   = useGlobeStore(s => s.appState)
  const setAppState = useGlobeStore(s => s.setAppState)
  const globeReady = useGlobeStore(s => s.globeReady)
  const panelOpen  = useActivitiesStore(s => s.panelOpen)
  const setPanelOpen = useActivitiesStore(s => s.setPanelOpen)

  /* Sync body class for CSS gating (globe-mode, viewing-activities) */
  useEffect(() => {
    const body = document.body
    if (appState === 'globe') body.classList.add('globe-mode')
    else body.classList.remove('globe-mode')
    if (appState === 'welcome') body.classList.add('welcome-mode')
    else body.classList.remove('welcome-mode')
  }, [appState])

  useEffect(() => {
    const body = document.body
    if (panelOpen) body.classList.add('viewing-activities')
    else body.classList.remove('viewing-activities')
  }, [panelOpen])

  const goBackToWelcome = () => {
    try { window.globeFlyHome?.() } catch {}
    setPanelOpen(false)
    setAppState('welcome')
  }

  return (
    <>
      {/* Stars + welcome logo canvas (always mounted; fades in globe mode) */}
      <WelcomeScene />

      {/* Welcome hint — non-interactive; the canvas itself handles the click */}
      {appState === 'welcome' && (
        <div className="welcome-cz-hint" aria-hidden="true">
          <span>{globeReady ? t('common.clickToEnter') : t('common.loading')}</span>
        </div>
      )}

      {/* Letters decorative backdrop */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="letters-bg"
        src="/letters.png"
        alt=""
        aria-hidden="true"
        width={1920}
        height={1080}
        decoding="async"
      />

      {/* Flash overlay */}
      <div id="fl" />

      {/* MapLibre globe */}
      <GlobeMap />

      {/* Globe brand top-right */}
      <div className="globe-brand" id="globeBrand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="مجمع الملك سلمان العالمي للغة العربية" width={64} height={64} decoding="async" />
      </div>

      {/* Language switcher top-left (globe mode) */}
      <div className="globe-lang">
        <LanguageSwitcher />
      </div>

      {/* Spin indicator */}
      <div id="spinInd" />

      {/* Back-to-globe (pin navigation) */}
      <button id="backBtn" type="button">{t('common.backToGlobe')}</button>

      {/* Stat columns */}
      <StatsColumn side="right" />
      <StatsColumn side="left" />

      {/* Activities toggle button */}
      <button
        className="act-toggle-btn"
        id="activitiesToggleBtn"
        aria-label={t('activities.toggleBtn')}
        onClick={() => setPanelOpen(true)}
      >
        <span className="atb-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </span>
        <span className="atb-text">
          <span className="atb-title">{t('activities.toggleBtn')}</span>
        </span>
        <span className="atb-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </span>
      </button>

      {/* Activities panel */}
      <ActivitiesPanel />

      {/* Welcome back button (bottom-left, globe mode) */}
      <button className="back-btn" id="welcomeBackBtn" title={t('common.backToHome')} onClick={goBackToWelcome}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Footer logos */}
      <div className="footer-logos">
        {/* Placeholder — swap with real logo images when provided */}
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 1 }}>
          شعار الرؤية · شعار برنامج تنمية القدرات · شعار المجمع
        </div>
      </div>

      {/* Loader overlay */}
      <div className="ld" id="ld">
        <div className="ld-r" />
        <div className="ld-t">{t('common.loading')}</div>
      </div>
    </>
  )
}
