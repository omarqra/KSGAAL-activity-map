'use client'
import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useGlobeStore } from '@/stores/globe'
import { useActivitiesStore } from '@/stores/activities'
import { buildActivities } from '@/lib/activities'
import type { ActivitiesData, Activity } from '@/lib/types'

const flagUrl = (code: string) => `https://flagcdn.com/w160/${code}.png`

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image(); i.crossOrigin = 'anonymous'
    i.onload = () => res(i); i.onerror = () => rej(new Error('img load failed: ' + url))
    i.src = url
  })
}

async function flagPinCanvas(code: string): Promise<HTMLCanvasElement> {
  const flag = await loadImg(flagUrl(code))
  const cv = document.createElement('canvas'); cv.width = 96; cv.height = 112
  const ctx = cv.getContext('2d')!; ctx.scale(2, 2)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2
  ctx.fillStyle = '#fff'
  ctx.fill(new Path2D('M24 54 C24 54 44 32 44 20 A20 20 0 1 0 4 20 C4 32 24 54 24 54 Z'))
  ctx.restore()
  const cx = 24, cy = 20, r = 18
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip()
  const sc = (r * 2) / Math.max(flag.width, flag.height)
  ctx.drawImage(flag, cx - flag.width*sc/2, cy - flag.height*sc/2, flag.width*sc, flag.height*sc)
  ctx.restore()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 0.8; ctx.stroke()
  return cv
}

function orgPinCanvas(letter: string): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = 96; cv.height = 112
  const ctx = cv.getContext('2d')!; ctx.scale(2, 2)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2
  const g = ctx.createLinearGradient(4, 0, 44, 40)
  g.addColorStop(0, '#b388ff'); g.addColorStop(1, '#ffd700')
  ctx.fillStyle = g
  ctx.fill(new Path2D('M24 54 C24 54 44 32 44 20 A20 20 0 1 0 4 20 C4 32 24 54 24 54 Z'))
  ctx.restore()
  const cx = 24, cy = 20, r = 14
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#0a1128'; ctx.fill()
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 16px Tajawal, Segoe UI, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(letter, cx, cy + 1)
  return cv
}

export default function GlobeMap() {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const setGlobeReady   = useGlobeStore(s => s.setGlobeReady)
  const spinEnabled     = useGlobeStore(s => s.spinEnabled)
  const setSpinEnabled  = useGlobeStore(s => s.setSpinEnabled)
  const setActiveActivity = useGlobeStore(s => s.setActiveActivity)
  const setPanelOpen    = useActivitiesStore(s => s.setPanelOpen)

  useEffect(() => {
    const map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        projection: { type: 'globe' },
        sources: {
          satellite: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: 'Tiles © Esri' },
          places:    { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 14 },
        },
        layers: [
          { id: 'sat',    type: 'raster', source: 'satellite' },
          { id: 'places', type: 'raster', source: 'places' },
        ],
      },
      center: [40, 25], zoom: 1.6, pitch: 0,
      maxTileCacheSize: 2000,
    })
    mapRef.current = map

    map.on('style.load', () => { try { map.setProjection({ type: 'globe' }) } catch {} })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right')
    map.dragRotate.disable()
    map.touchPitch.disable()
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()

    const mapEl = document.getElementById('map')!
    map.on('mousedown', () => mapEl.classList.add('dragging'))
    map.on('mouseup',   () => mapEl.classList.remove('dragging'))

    /* Zoom-driven pin scale */
    const updatePinScale = () => {
      const z = map.getZoom()
      const t = Math.max(0, Math.min(1, z / 8))
      document.documentElement.style.setProperty('--pin-scale-global', (0.25 + 0.75 * t).toFixed(3))
    }
    map.on('zoom', updatePinScale)
    map.once('load', updatePinScale)

    /* Auto-rotate */
    const SECONDS_PER_REV = 180, SPIN_TICK_MS = 1000, MAX_SPIN_ZOOM = 4, WHEEL_IDLE_MS = 1500
    let spinOn = true, userInteracting = false, wheelTimer: ReturnType<typeof setTimeout> | null = null

    const spinInd = document.getElementById('spinInd')
    const updateSpinInd = () => {
      if (!spinInd) return
      spinInd.textContent = spinOn ? '● دوران تلقائي' : '○ دوران متوقف'
      spinInd.classList.toggle('off', !spinOn)
    }
    updateSpinInd()
    spinInd?.addEventListener('click', () => {
      spinOn = !spinOn; updateSpinInd()
      if (spinOn) spinGlobeTick(); else { try { map.stop() } catch {} }
    })

    function spinGlobeTick() {
      if (!spinOn || userInteracting) return
      if (map.getZoom() > MAX_SPIN_ZOOM) return
      if (map.isEasing() || map.isMoving() || map.isZooming() || map.isRotating()) return
      const dist = (360 / SECONDS_PER_REV) * (SPIN_TICK_MS / 1000)
      const c = map.getCenter(); c.lng -= dist
      try { map.easeTo({ center: c, duration: SPIN_TICK_MS, easing: n => n }) } catch {}
    }

    map.on('mousedown',  () => { userInteracting = true })
    map.on('touchstart', () => { userInteracting = true })
    map.on('mouseup',    () => { userInteracting = false; spinGlobeTick() })
    map.on('touchend',   () => { userInteracting = false; spinGlobeTick() })
    map.on('moveend',    () => { spinGlobeTick() })
    map.getCanvasContainer().addEventListener('wheel', () => {
      userInteracting = true
      if (wheelTimer) clearTimeout(wheelTimer)
      wheelTimer = setTimeout(() => { userInteracting = false; spinGlobeTick() }, WHEEL_IDLE_MS)
    }, { passive: true })

    /* Expose globally for welcome scene handoff */
    window.setGlobeAutoRotate = (v: boolean) => {
      spinOn = !!v; updateSpinInd()
      if (spinOn) spinGlobeTick(); else { try { map.stop() } catch {} }
    }

    /* Back-to-globe button */
    const backBtn = document.getElementById('backBtn')
    let activeEl: HTMLElement | null = null

    function flyHome() {
      spinOn = true; updateSpinInd()
      if (activeEl) { activeEl.classList.remove('active'); activeEl = null }
      backBtn?.classList.remove('visible')
      setActiveActivity(null)
      map.flyTo({ center: [40, 25], zoom: 1.6, essential: true })
    }
    backBtn?.addEventListener('click', flyHome)

    function flyToPin(act: Activity, el: HTMLElement) {
      spinOn = false; updateSpinInd()
      if (activeEl) activeEl.classList.remove('active')
      activeEl = el; el.classList.add('active')
      userInteracting = true
      const opts: maplibregl.FlyToOptions = { center: [act.lng, act.lat], essential: true }
      if (map.getZoom() < 4) opts.zoom = 5
      map.flyTo(opts)
      map.once('moveend', () => { userInteracting = false })
      setTimeout(() => backBtn?.classList.add('visible'), 250)
    }

    /* Load data + build pins */
    map.on('load', async () => {
      try {
        const data: ActivitiesData = await (await fetch('/data/activities.json')).json()
        const allActivities = buildActivities(data)
        data._activities = allActivities

        /* Build pin canvases */
        const pinCanvases: Record<string, string> = {}
        await Promise.all([
          ...data.countries.map(async c => {
            try { pinCanvases[c.code] = (await flagPinCanvas(c.code)).toDataURL() } catch {}
          }),
          ...data.organizations.map(o => {
            const letter = (o.short || o.name || '?').charAt(0)
            pinCanvases[o.code] = orgPinCanvas(letter).toDataURL()
          }),
        ])

        /* Place one pin per activity */
        const pinMarkers: Record<string, { marker: maplibregl.Marker; el: HTMLElement; entityCode: string }> = {}
        allActivities.forEach(act => {
          if (typeof act.lat !== 'number' || typeof act.lng !== 'number') return
          if (!pinCanvases[act.entityCode]) return
          const wrap = document.createElement('div'); wrap.className = 'pin-marker-wrap'
          wrap.title = `${act.entity.short} — ${act.name}`
          const inner = document.createElement('div'); inner.className = 'pin-marker'
          inner.style.backgroundImage = `url(${pinCanvases[act.entityCode]})`
          wrap.appendChild(inner)
          wrap.addEventListener('click', ev => {
            ev.stopPropagation()
            setActiveActivity(act)
            setPanelOpen(true)
            flyToPin(act, wrap)
          })
          const marker = new maplibregl.Marker({ element: wrap, anchor: 'bottom', opacityWhenCovered: '0' })
            .setLngLat([act.lng, act.lat]).addTo(map)
          pinMarkers[act.id] = { marker, el: wrap, entityCode: act.entityCode }
        })

        /* Expose pin filter */
        window.setActivityFilter = (ids: Set<string> | null) => {
          Object.entries(pinMarkers).forEach(([id, entry]) => {
            entry.el.style.display = (!ids || ids.has(id)) ? '' : 'none'
          })
        }
        window.globeFlyToActivity = (act: Activity) => {
          if (!act) return
          const entry = pinMarkers[act.id]
          flyToPin(act, entry ? entry.el : document.createElement('div'))
        }
        window.globeFlyHome = flyHome

        /* Animate stats then enter globe */
        document.dispatchEvent(new CustomEvent('globe:data', { detail: { data, activities: allActivities } }))

        setGlobeReady(true)
        spinGlobeTick()

        /* Fade out loader */
        const ld = document.getElementById('ld')
        if (ld) { ld.classList.add('go'); setTimeout(() => ld.remove(), 1100) }
      } catch (e) {
        console.error('Failed to load activities.json:', e)
        setGlobeReady(true)
      }
    })

    return () => { map.remove(); mapRef.current = null }
  }, [setGlobeReady, setActiveActivity, setPanelOpen])

  return <div id="map" />
}

declare global {
  interface Window {
    setGlobeAutoRotate: (v: boolean) => void
    setActivityFilter: (ids: Set<string> | null) => void
    globeFlyToActivity: (act: Activity) => void
    globeFlyHome: () => void
  }
}
