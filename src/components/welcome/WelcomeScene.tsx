'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGlobeStore } from '@/stores/globe'

function makeStarLayer(count: number, spread: number, size: number, opacity: number) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)
    const r     = spread * 0.3 + Math.random() * spread * 0.7
    pos[i*3]   = Math.sin(phi) * Math.cos(theta) * r
    pos[i*3+1] = Math.sin(phi) * Math.sin(theta) * r
    pos[i*3+2] = Math.cos(phi) * r
    const c = new THREE.Color()
    const rr = Math.random()
    if      (rr < 0.03) c.setHSL(0.6,  0.5, 0.85)
    else if (rr < 0.05) c.setHSL(0.08, 0.6, 0.82)
    else if (rr < 0.08) c.setHSL(0.55, 0.3, 0.75)
    else                c.setHSL(0, 0, 0.6 + Math.random() * 0.4)
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size, vertexColors: true, transparent: true, opacity,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }))
}

export default function WelcomeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appState = useGlobeStore(s => s.appState)
  const setAppState = useGlobeStore(s => s.setAppState)
  const globeReady = useGlobeStore(s => s.globeReady)

  /* Mirror reactive values into refs so the rAF loop sees current values */
  const appStateRef = useRef(appState)
  const globeReadyRef = useRef(globeReady)
  useEffect(() => { appStateRef.current = appState }, [appState])
  useEffect(() => { globeReadyRef.current = globeReady }, [globeReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const W = () => window.innerWidth
    const H = () => window.innerHeight

    const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    R.setPixelRatio(Math.min(devicePixelRatio, 2))
    R.setSize(W(), H())
    R.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 3000)
    cam.position.set(0, 0, 5)

    /* Stars */
    const starsF = makeStarLayer(6000, 300, 0.02, 0.5); scene.add(starsF)
    const starsM = makeStarLayer(2000, 150, 0.06, 0.7); scene.add(starsM)
    const starsN = makeStarLayer( 300,  60, 0.12, 0.9); scene.add(starsN)

    /* Nebulae */
    const mkNeb = (x: number, y: number, z: number, s: number, col: string, op: number) => {
      const nc = document.createElement('canvas'); nc.width = 256; nc.height = 256
      const nx = nc.getContext('2d')!
      const g  = nx.createRadialGradient(128,128,0,128,128,128)
      g.addColorStop(0,   `rgba(${col},${op})`)
      g.addColorStop(0.4, `rgba(${col},${op*0.3})`)
      g.addColorStop(1,   `rgba(${col},0)`)
      nx.fillStyle = g; nx.fillRect(0,0,256,256)
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(nc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
      sp.position.set(x,y,z); sp.scale.set(s,s,1); scene.add(sp)
    }
    mkNeb(-20,10,-50,50,'50,25,90',0.1)
    mkNeb(25,-8,-60,40,'25,50,85',0.08)
    mkNeb(8,15,-40,30,'35,70,70',0.06)

    /* Icon group */
    const iconGrp = new THREE.Group(); scene.add(iconGrp)
    const iconMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.8), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }))
    iconGrp.add(iconMesh)
    new THREE.TextureLoader().load('/Container.png', tex => {
      tex.colorSpace = THREE.SRGBColorSpace
      iconMesh.material.map = tex; iconMesh.material.needsUpdate = true
    })

    /* Glow */
    const glowCv = document.createElement('canvas'); glowCv.width = 256; glowCv.height = 256
    const glowCtx = glowCv.getContext('2d')!
    const gg = glowCtx.createRadialGradient(128,128,10,128,128,128)
    gg.addColorStop(0,  'rgba(91,164,164,.18)')
    gg.addColorStop(0.3,'rgba(201,168,76,.08)')
    gg.addColorStop(0.6,'rgba(91,164,164,.04)')
    gg.addColorStop(1,  'rgba(0,0,0,0)')
    glowCtx.fillStyle = gg; glowCtx.fillRect(0,0,256,256)
    const glowSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }))
    glowSp.scale.set(7,7,1); glowSp.position.z = -0.3; iconGrp.add(glowSp)

    /* Orbit rings */
    const orbits: THREE.Points[] = []
    ;[
      { rad:2.2, cnt:90,  color:0xc9a84c, op:0, spd: 0.06, sz:0.028, maxOp:0.30 },
      { rad:3.05,cnt:120, color:0x5ba4a4, op:0, spd:-0.04, sz:0.020, maxOp:0.15 },
    ].forEach(cfg => {
      const geo = new THREE.BufferGeometry()
      const p = new Float32Array(cfg.cnt * 3)
      for (let i = 0; i < cfg.cnt; i++) {
        const a = (i/cfg.cnt)*Math.PI*2
        p[i*3]=Math.cos(a)*cfg.rad; p[i*3+1]=Math.sin(a)*cfg.rad; p[i*3+2]=0
      }
      geo.setAttribute('position', new THREE.BufferAttribute(p,3))
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size:cfg.sz, color:cfg.color, transparent:true, opacity:cfg.op, blending:THREE.AdditiveBlending, depthWrite:false }))
      ;(pts as unknown as { userData: { spd: number; maxOp: number } }).userData = { spd:cfg.spd, maxOp:cfg.maxOp }
      iconGrp.add(pts); orbits.push(pts)
    })

    scene.add(new THREE.AmbientLight(0x334466, 0.5))
    const sunL = new THREE.DirectionalLight(0xffeedd, 1.3)
    sunL.position.set(5,3,5); scene.add(sunL)

    let iconAlpha = 0
    const clk = new THREE.Clock()
    let mx = 0, my = 0
    let rafId: number
    let transT = 0
    let lastState: typeof appState = 'welcome'
    let transHandedOff = false

    /* Meteor pool — streaks that whip past the camera during the warp */
    interface Meteor {
      line: THREE.Line
      dir: THREE.Vector3
      speed: number
      life: number
      max: number
    }
    const meteorPool: Meteor[] = []
    const spawnMeteor = (fromBehind: boolean) => {
      const seg = 35, len = 4 + Math.random() * 10
      const geo = new THREE.BufferGeometry()
      const pos: number[] = [], col: number[] = []
      for (let i = 0; i <= seg; i++) {
        const tt = i / seg; pos.push(0, 0, -tt * len)
        const a = Math.pow(1 - tt, 1.5), ty = Math.random()
        let r: number, g: number, b: number
        if      (ty < 0.35) { r = 1;    g = 0.78; b = 0.35 }
        else if (ty < 0.6)  { r = 0.45; g = 0.85; b = 0.85 }
        else                { r = 0.95; g = 0.92; b = 1    }
        col.push(r * a, g * a, b * a)
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3))
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
      const line = new THREE.Line(geo, mat)
      let dir: THREE.Vector3, speed: number, max: number
      if (fromBehind) {
        line.position.set((Math.random()-0.5)*18, (Math.random()-0.5)*12, 10 + Math.random()*20)
        const tgt = new THREE.Vector3((Math.random()-0.5)*6, (Math.random()-0.5)*4, -900)
        dir = tgt.clone().sub(line.position).normalize()
        line.lookAt(line.position.clone().add(dir))
        speed = 0.8 + Math.random()*2; max = 200
      } else {
        const a1 = Math.random() * Math.PI * 2, a2 = (Math.random()-0.5) * 0.8
        dir = new THREE.Vector3(
          Math.cos(a1)*Math.cos(a2),
          Math.sin(a2),
          Math.sin(a1)*Math.cos(a2),
        )
        const d = 25 + Math.random() * 40
        line.position.copy(dir.clone().multiplyScalar(-d))
        line.lookAt(line.position.clone().add(dir))
        speed = 0.15 + Math.random()*0.4; max = 120 + Math.random()*100
        mat.opacity = 0.4 + Math.random() * 0.3
      }
      scene.add(line)
      meteorPool.push({ line, dir, speed, life: 0, max })
    }
    let ambTimer = 0
    const meteorTimers: number[] = []

    const onMove = (e: MouseEvent) => {
      mx = (e.clientX/W()-0.5)*2
      my = (e.clientY/H()-0.5)*2
    }
    window.addEventListener('mousemove', onMove)

    /* Click → start zoom transition (only if globe data is ready) */
    const onClick = () => {
      if (appStateRef.current !== 'welcome') return
      if (!globeReadyRef.current) return
      transT = 0
      transHandedOff = false
      setAppState('trans_fwd')
      /* Stagger 140 streaks toward the camera — hyperspace effect */
      for (let i = 0; i < 140; i++) {
        meteorTimers.push(window.setTimeout(() => spawnMeteor(true), i * 18))
      }
    }
    canvas.addEventListener('click', onClick)

    /* Restore logo when state goes back to welcome from globe */
    const restoreWelcome = () => {
      transT = 0; transHandedOff = false
      iconGrp.visible = true
      iconGrp.scale.setScalar(1)
      iconGrp.rotation.set(0,0,0)
      iconAlpha = 1
      ;(iconMesh.material as THREE.MeshBasicMaterial).opacity = 1
      ;(orbits[0].material as THREE.PointsMaterial).opacity = (orbits[0] as unknown as { userData: { maxOp: number } }).userData.maxOp
      ;(orbits[1].material as THREE.PointsMaterial).opacity = (orbits[1] as unknown as { userData: { maxOp: number } }).userData.maxOp
      cam.position.set(0,0,5); cam.lookAt(0,0,0); cam.rotation.z = 0
    }

    const tick = () => {
      rafId = requestAnimationFrame(tick)
      const dt = clk.getDelta(); const t = clk.getElapsedTime()
      const state = appStateRef.current

      /* Detect state transitions */
      if (state !== lastState) {
        if (state === 'welcome' && lastState === 'globe') restoreWelcome()
        lastState = state
      }

      if (state === 'welcome') {
        cam.position.x += (mx*0.2 - cam.position.x)*0.03
        cam.position.y += (-my*0.12 - cam.position.y)*0.03
        cam.position.z = 5; cam.lookAt(0,0,0)

        const DELAY=0.05, DUR=0.25
        if (t>DELAY && iconAlpha<1) {
          iconAlpha = Math.min((t-DELAY)/DUR, 1)
          const mat = iconMesh.material as THREE.MeshBasicMaterial
          if (mat.map) mat.opacity = iconAlpha
          ;(orbits[0].material as THREE.PointsMaterial).opacity = (orbits[0] as unknown as { userData: { maxOp: number } }).userData.maxOp * iconAlpha
          ;(orbits[1].material as THREE.PointsMaterial).opacity = (orbits[1] as unknown as { userData: { maxOp: number } }).userData.maxOp * iconAlpha
        }
        iconGrp.rotation.y += (mx*0.06 - iconGrp.rotation.y)*0.05
        iconGrp.rotation.x += (my*0.04 - iconGrp.rotation.x)*0.05
        glowSp.material.opacity = iconAlpha*(0.45+Math.sin(t*1.8)*0.18)
        orbits.forEach(o => { o.rotation.z += (o as unknown as { userData: { spd: number } }).userData.spd * dt })

        /* Ambient meteor every few seconds during welcome */
        ambTimer += dt
        if (ambTimer > 3.5 + Math.random() * 4) { ambTimer = 0; spawnMeteor(false) }
      } else if (state === 'trans_fwd') {
        transT += dt
        const dur = 3.2, p = Math.min(transT / dur, 1)

        /* Phase 1 — logo fades + shrinks */
        if (p < 0.2) {
          const pp = p / 0.2, ease = 1 - Math.pow(1 - pp, 3)
          iconGrp.scale.setScalar(1 - ease*0.3)
          ;(iconMesh.material as THREE.MeshBasicMaterial).opacity = (1 - ease) * iconAlpha
          glowSp.material.opacity = (1 - ease) * 0.45
          orbits.forEach(o => { (o.material as THREE.PointsMaterial).opacity *= 0.95 })
          cam.position.z = 5 - ease*5; cam.lookAt(0,0,-100)
        }
        /* Phase 2 — camera warps forward through space */
        else if (p < 0.72) {
          const pp = (p - 0.2) / 0.52, ease = pp*pp
          iconGrp.visible = false
          cam.position.z = 0 - ease*300
          cam.position.x = Math.sin(t*3)   * 0.3 * (1 - pp)
          cam.position.y = Math.cos(t*2.5) * 0.2 * (1 - pp)
          cam.lookAt(cam.position.x, cam.position.y, cam.position.z - 100)
          cam.rotation.z = (Math.random() - 0.5) * 0.01 * (1 - pp)
        }
        /* Phase 3 — flash, then hand off to the globe */
        else {
          const pp = (p - 0.72) / 0.28
          cam.position.z = 5; cam.lookAt(0,0,0); cam.rotation.z = 0
          const fl = document.getElementById('fl')
          if (fl) {
            fl.style.opacity = pp < 0.3
              ? String((pp / 0.3) * 0.85)
              : String(0.85 * (1 - (pp - 0.3) / 0.7))
          }
          if (!transHandedOff && pp >= 0.3) {
            transHandedOff = true
            setTimeout(() => {
              setAppState('globe')
              const fl2 = document.getElementById('fl')
              if (fl2) fl2.style.opacity = '0'
            }, 120)
          }
        }
      }
      /* In 'globe' state, the logo is hidden but stars keep rotating as a backdrop */

      /* Update meteor positions (active in welcome + trans_fwd) */
      for (let i = meteorPool.length - 1; i >= 0; i--) {
        const m = meteorPool[i]
        m.line.position.add(m.dir.clone().multiplyScalar(m.speed))
        m.life++
        if (m.life > m.max * 0.8) (m.line.material as THREE.LineBasicMaterial).opacity *= 0.92
        if (m.life > m.max) {
          scene.remove(m.line)
          m.line.geometry.dispose()
          ;(m.line.material as THREE.Material).dispose()
          meteorPool.splice(i, 1)
        }
      }

      starsF.rotation.y += 0.00005
      starsM.rotation.y += 0.0001
      starsN.rotation.y += 0.0002
      starsF.rotation.x += 0.00002
      starsN.material.opacity = 0.7 + 0.2*Math.sin(t*1.5)
      R.render(scene, cam)
    }
    tick()

    const onResize = () => {
      cam.aspect = W()/H(); cam.updateProjectionMatrix(); R.setSize(W(),H())
    }
    window.addEventListener('resize', onResize)

    /* Fade out loader */
    setTimeout(() => {
      const ld = document.getElementById('ld')
      if (ld) { ld.classList.add('go'); setTimeout(() => ld.remove(), 1100) }
    }, 400)

    return () => {
      cancelAnimationFrame(rafId)
      meteorTimers.forEach(clearTimeout)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      R.dispose()
    }
  }, [setAppState])

  return (
    <canvas
      ref={canvasRef}
      id="c"
      style={{
        position:'fixed', inset:0, width:'100vw', height:'100vh',
        zIndex:0, display:'block', background:'#000',
        cursor: appState === 'welcome' && globeReady ? 'pointer' : 'default',
        pointerEvents: appState === 'welcome' ? 'auto' : 'none',
      }}
    />
  )
}
