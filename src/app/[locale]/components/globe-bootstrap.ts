/* eslint-disable max-lines, @typescript-eslint/no-explicit-any, prefer-template */
/**
 * GlobeScene bootstrap — direct port of the imperative welcome + MapLibre
 * globe + activities-panel logic from html/test-globe.html. Kept as a single
 * imperative function (not split into React components) so behavior, timing,
 * and DOM-id wiring stay 1:1 with the original.
 *
 * The function is invoked from globe-scene.tsx inside a useEffect, and its
 * returned cleanup tears down the render loop and the MapLibre instance.
 */
import maplibregl from "maplibre-gl";
import * as THREE from "three";

import type {
  GlobeActivity as Activity,
  GlobeData as ActivitiesData,
  GlobeEntity as Entity,
} from "@/server/globe/types";

export type GlobeTranslator = (key: string) => string;

export function bootstrapGlobeScene(
  t: GlobeTranslator,
  data: ActivitiesData,
  locale: string = "ar",
): () => void {

  /* Arabic on the map renders as disconnected, left-to-right glyphs unless
     MapLibre is given an RTL text shaper. The mapbox-gl-rtl-text plugin
     handles bidi reordering and contextual letter joining (initial/medial/
     final forms). Status guard avoids the "already registered" throw when
     bootstrap re-runs after a locale switch. */
  try {
    const status = (maplibregl as any).getRTLTextPluginStatus?.();
    if (!status || status === "unavailable") {
      (maplibregl as any).setRTLTextPlugin(
        "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
        true,
      );
    }
  } catch (err) {
    console.warn("[globe] RTL text plugin failed to register:", err);
  }

  /* Numerals follow the active UI locale: ar → Arabic-Indic, en → Western. */
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const fmtNum = (n: number): string => n.toLocaleString(numberLocale);
  /* Years are 4-digit identifiers, not magnitudes — never group with a
     thousand separator (otherwise 2024 renders as "٢٬٠٢٤"/"2,024"). */
  const fmtYear = (y: number): string =>
    y.toLocaleString(numberLocale, { useGrouping: false });

  const startInGlobe = true;
  let appState: "welcome" | "trans_fwd" | "globe" = "welcome";
  let globeReady = false;
  let rafId: number | null = null;
  let iconAlpha = 0;
  let transT = 0;
  let transLocked = false;
  let mx = 0;
  let my = 0;
  let ambTimer = 0;

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const cvs = document.getElementById("c") as HTMLCanvasElement | null;
  if (!cvs) {
    console.error("[globe] #c canvas not found");
    return () => undefined;
  }

  const R = new THREE.WebGLRenderer({
    canvas: cvs,
    antialias: true,
    alpha: true,
  });
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  R.setSize(W(), H());
  R.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 3000);
  cam.position.set(0, 0, 5);

  /* ── Stars (counts match index.html: 6000 / 2000 / 300) ── */
  function makeStarLayer(
    count: number,
    spread: number,
    size: number,
    opacity: number,
  ) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spread * 0.3 + Math.random() * spread * 0.7;
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      pos[i * 3 + 2] = Math.cos(phi) * r;
      const c = new THREE.Color();
      const rr = Math.random();
      if (rr < 0.03) c.setHSL(0.6, 0.5, 0.85);
      else if (rr < 0.05) c.setHSL(0.08, 0.6, 0.82);
      else if (rr < 0.08) c.setHSL(0.55, 0.3, 0.75);
      else c.setHSL(0, 0, 0.6 + Math.random() * 0.4);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size,
        vertexColors: true,
        transparent: true,
        opacity,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
  }

  const starsF = makeStarLayer(6000, 300, 0.02, 0.5);
  scene.add(starsF);
  const starsM = makeStarLayer(2000, 150, 0.06, 0.7);
  scene.add(starsM);
  const starsN = makeStarLayer(300, 60, 0.12, 0.9);
  scene.add(starsN);

  /* ── Nebulae ── */
  function mkNeb(
    x: number,
    y: number,
    z: number,
    s: number,
    col: string,
    op: number,
  ) {
    const nc = document.createElement("canvas");
    nc.width = 256;
    nc.height = 256;
    const nx = nc.getContext("2d")!;
    const g = nx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, `rgba(${col},${op})`);
    g.addColorStop(0.4, `rgba(${col},${op * 0.3})`);
    g.addColorStop(1, `rgba(${col},0)`);
    nx.fillStyle = g;
    nx.fillRect(0, 0, 256, 256);
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(nc),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    sp.position.set(x, y, z);
    sp.scale.set(s, s, 1);
    scene.add(sp);
  }
  mkNeb(-20, 10, -50, 50, "50,25,90", 0.1);
  mkNeb(25, -8, -60, 40, "25,50,85", 0.08);
  mkNeb(8, 15, -40, 30, "35,70,70", 0.06);

  /* ── Icon group: logo plane + glow sprite + two orbit rings ── */
  const iconGrp = new THREE.Group();
  scene.add(iconGrp);

  const iconMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 2.8),
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      opacity: 0,
    }),
  );
  iconGrp.add(iconMesh);

  new THREE.TextureLoader().load("/globe/Container.png", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    (iconMesh.material as THREE.MeshBasicMaterial).map = tex;
    (iconMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
  });

  /* Glow behind the logo */
  const glowCv = document.createElement("canvas");
  glowCv.width = 256;
  glowCv.height = 256;
  const glowCtx = glowCv.getContext("2d")!;
  const glowGrad = glowCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
  glowGrad.addColorStop(0, "rgba(91,164,164,.18)");
  glowGrad.addColorStop(0.3, "rgba(201,168,76,.08)");
  glowGrad.addColorStop(0.6, "rgba(91,164,164,.04)");
  glowGrad.addColorStop(1, "rgba(0,0,0,0)");
  glowCtx.fillStyle = glowGrad;
  glowCtx.fillRect(0, 0, 256, 256);
  const glowSp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCv),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    }),
  );
  glowSp.scale.set(7, 7, 1);
  glowSp.position.z = -0.3;
  iconGrp.add(glowSp);

  /* Two orbit rings — gold (inner) + teal (outer) */
  const orbits: Array<THREE.Points & { userData: any }> = [];
  [
    { rad: 2.2, cnt: 90, color: 0xc9a84c, op: 0, spd: 0.06, sz: 0.028 },
    { rad: 3.05, cnt: 120, color: 0x5ba4a4, op: 0, spd: -0.04, sz: 0.02 },
  ].forEach((cfg) => {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(cfg.cnt * 3);
    for (let i = 0; i < cfg.cnt; i++) {
      const a = (i / cfg.cnt) * Math.PI * 2;
      p[i * 3] = Math.cos(a) * cfg.rad;
      p[i * 3 + 1] = Math.sin(a) * cfg.rad;
      p[i * 3 + 2] = 0;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: cfg.sz,
        color: cfg.color,
        transparent: true,
        opacity: cfg.op,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ) as THREE.Points & { userData: any };
    pts.userData.spd = cfg.spd;
    iconGrp.add(pts);
    orbits.push(pts);
  });
  orbits[0].userData.maxOp = 0.3;
  orbits[1].userData.maxOp = 0.15;

  /* ── Earth group (for warp-depth during trans_fwd only) ── */
  const earthGrp = new THREE.Group();
  earthGrp.position.set(0, 0, -800);
  scene.add(earthGrp);
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 96, 96),
    new THREE.MeshPhongMaterial({ specular: 0x112244, shininess: 18 }),
  );
  earthMesh.rotation.y = -0.6;
  earthGrp.add(earthMesh);
  new THREE.TextureLoader().load(
    "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    (tex) => {
      tex.anisotropy = R.capabilities.getMaxAnisotropy();
      (earthMesh.material as THREE.MeshPhongMaterial).map = tex;
      (earthMesh.material as THREE.MeshPhongMaterial).needsUpdate = true;
    },
  );
  new THREE.TextureLoader().load(
    "https://unpkg.com/three-globe/example/img/earth-topology.png",
    (bump) => {
      (earthMesh.material as THREE.MeshPhongMaterial).bumpMap = bump;
      (earthMesh.material as THREE.MeshPhongMaterial).bumpScale = 0.05;
      (earthMesh.material as THREE.MeshPhongMaterial).needsUpdate = true;
    },
  );
  earthGrp.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(1.38, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader:
          "varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec3 vN;void main(){float i=pow(.62-dot(vN,vec3(0,0,1)),2.8);gl_FragColor=vec4(.3,.6,1.,1.)*i*.9;}",
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      }),
    ),
  );
  scene.add(new THREE.AmbientLight(0x334466, 0.5));
  const sunL = new THREE.DirectionalLight(0xffeedd, 1.3);
  sunL.position.set(5, 3, 5);
  scene.add(sunL);

  /* ── Meteor pool ── */
  const meteorPool: Array<THREE.Line & { userData: any }> = [];
  function spawnMeteor(fromBehind: boolean) {
    const seg = 35,
      len = 4 + Math.random() * 10;
    const geo = new THREE.BufferGeometry();
    const pos: number[] = [],
      col: number[] = [];
    for (let i = 0; i <= seg; i++) {
      const t_ = i / seg;
      pos.push(0, 0, -t_ * len);
      const a = Math.pow(1 - t_, 1.5),
        ty = Math.random();
      let r: number, g: number, b: number;
      if (ty < 0.35) {
        r = 1;
        g = 0.78;
        b = 0.35;
      } else if (ty < 0.6) {
        r = 0.45;
        g = 0.85;
        b = 0.85;
      } else {
        r = 0.95;
        g = 0.92;
        b = 1;
      }
      col.push(r * a, g * a, b * a);
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(geo, mat) as THREE.Line & { userData: any };
    if (fromBehind) {
      line.position.set(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 12,
        10 + Math.random() * 20,
      );
      const tgt = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        -900,
      );
      const dir = tgt.clone().sub(line.position).normalize();
      line.lookAt(line.position.clone().add(dir));
      line.userData = { dir, speed: 0.8 + Math.random() * 2, life: 0, max: 200 };
    } else {
      const a1 = Math.random() * Math.PI * 2,
        a2 = (Math.random() - 0.5) * 0.8;
      const dir = new THREE.Vector3(
        Math.cos(a1) * Math.cos(a2),
        Math.sin(a2),
        Math.sin(a1) * Math.cos(a2),
      );
      const d = 25 + Math.random() * 40;
      line.position.copy(dir.clone().multiplyScalar(-d));
      line.lookAt(line.position.clone().add(dir));
      line.userData = {
        dir,
        speed: 0.15 + Math.random() * 0.4,
        life: 0,
        max: 120 + Math.random() * 100,
      };
      mat.opacity = 0.4 + Math.random() * 0.3;
    }
    scene.add(line);
    meteorPool.push(line);
  }

  /* ── Welcome click handler ── */
  const cz = document.getElementById("cz")!;
  const fl = document.getElementById("fl")!;

  const onMouseMove = (e: MouseEvent) => {
    mx = (e.clientX / W() - 0.5) * 2;
    my = (e.clientY / H() - 0.5) * 2;
  };
  document.addEventListener("mousemove", onMouseMove);

  function goForward() {
    if (appState !== "welcome" || transLocked) return;
    appState = "trans_fwd";
    transT = 0;
    cz.style.display = "none";
    for (let i = 0; i < 50; i++) setTimeout(() => spawnMeteor(true), i * 40);
  }
  cz.addEventListener("click", goForward);

  /* ── Render loop ── */
  const clk = new THREE.Clock();

  function tick() {
    rafId = requestAnimationFrame(tick);
    const dt = clk.getDelta(),
      t = clk.getElapsedTime();

    if (appState === "welcome") {
      cam.position.x += (mx * 0.2 - cam.position.x) * 0.03;
      cam.position.y += (-my * 0.12 - cam.position.y) * 0.03;
      cam.position.z = 5;
      cam.lookAt(0, 0, 0);

      const DELAY = 0.05,
        DUR = 0.25;
      if (t > DELAY && iconAlpha < 1) {
        iconAlpha = Math.min((t - DELAY) / DUR, 1);
        const m = iconMesh.material as THREE.MeshBasicMaterial;
        if (m.map) m.opacity = iconAlpha;
        (orbits[0].material as THREE.PointsMaterial).opacity =
          orbits[0].userData.maxOp * iconAlpha;
        (orbits[1].material as THREE.PointsMaterial).opacity =
          orbits[1].userData.maxOp * iconAlpha;
      }

      iconGrp.rotation.y += (mx * 0.06 - iconGrp.rotation.y) * 0.05;
      iconGrp.rotation.x += (my * 0.04 - iconGrp.rotation.x) * 0.05;

      (glowSp.material as THREE.SpriteMaterial).opacity =
        iconAlpha * (0.45 + Math.sin(t * 1.8) * 0.18);

      orbits.forEach((o) => (o.rotation.z += o.userData.spd * dt));

      ambTimer += dt;
      if (ambTimer > 3.5 + Math.random() * 4) {
        ambTimer = 0;
        spawnMeteor(false);
      }
    }

    /* Meteor updates (shared by welcome + trans_fwd) */
    for (let i = meteorPool.length - 1; i >= 0; i--) {
      const m = meteorPool[i];
      m.position.add(m.userData.dir.clone().multiplyScalar(m.userData.speed));
      m.userData.life++;
      if (m.userData.life > m.userData.max * 0.8)
        (m.material as THREE.LineBasicMaterial).opacity *= 0.92;
      if (m.userData.life > m.userData.max) {
        scene.remove(m);
        meteorPool.splice(i, 1);
      }
    }

    if (appState === "trans_fwd") {
      transT += dt;
      const dur = 1.2,
        p = Math.min(transT / dur, 1);

      if (p < 0.2) {
        const pp = p / 0.2,
          ease = 1 - Math.pow(1 - pp, 3);
        iconGrp.scale.setScalar(1 - ease * 0.3);
        (iconMesh.material as THREE.MeshBasicMaterial).opacity =
          (1 - ease) * iconAlpha;
        (glowSp.material as THREE.SpriteMaterial).opacity = (1 - ease) * 0.45;
        orbits.forEach(
          (o) => ((o.material as THREE.PointsMaterial).opacity *= 0.95),
        );
        cam.position.z = 5 - ease * 5;
        cam.lookAt(0, 0, -100);
      }
      if (p >= 0.2 && p < 0.72) {
        const pp = (p - 0.2) / 0.52,
          ease = pp * pp;
        iconGrp.visible = false;
        cam.position.z = 0 - ease * 300;
        cam.position.x = Math.sin(t * 3) * 0.3 * (1 - pp);
        cam.position.y = Math.cos(t * 2.5) * 0.2 * (1 - pp);
        cam.lookAt(cam.position.x, cam.position.y, cam.position.z - 100);
        cam.rotation.z = (Math.random() - 0.5) * 0.01 * (1 - pp);
      }
      if (p >= 0.72) {
        const pp = (p - 0.72) / 0.28;
        cam.position.z = 5;
        cam.lookAt(0, 0, 0);
        cam.rotation.z = 0;
        fl.style.opacity =
          pp < 0.3
            ? String((pp / 0.3) * 0.85)
            : String(0.85 * (1 - (pp - 0.3) / 0.7));
        if (!transLocked && pp >= 0.3) {
          transLocked = true;
          const ov = document.getElementById("transOverlay")!;
          ov.style.transition = "opacity 0.38s ease";
          ov.classList.add("vis");
          const doEnter = () => {
            if (globeReady) enterGlobeState();
            else {
              const w = setInterval(() => {
                if (globeReady) {
                  clearInterval(w);
                  enterGlobeState();
                }
              }, 80);
              setTimeout(() => {
                clearInterval(w);
                enterGlobeState();
              }, 8000);
            }
          };
          setTimeout(doEnter, 120);
        }
      }
    }

    starsF.rotation.y += 0.00005;
    starsM.rotation.y += 0.0001;
    starsN.rotation.y += 0.0002;
    starsF.rotation.x += 0.00002;
    (starsN.material as THREE.PointsMaterial).opacity =
      0.7 + 0.2 * Math.sin(t * 1.5);

    if (earthGrp.position.z > -700) earthMesh.rotation.y += 0.0008;
    R.render(scene, cam);
  }

  /* ── State transitions ── */
  function enterGlobeState() {
    if (appState === "globe") return;
    appState = "globe";

    const hdr = document.getElementById("welcomeHdr");
    if (hdr) {
      hdr.style.opacity = "0";
      hdr.style.pointerEvents = "none";
    }
    fl.style.opacity = "0";
    iconGrp.visible = false;
    cz.style.display = "none";
    cz.style.pointerEvents = "none";

    document.body.classList.add("globe-mode");

    setTimeout(animateStats, 300);

    const ov = document.getElementById("transOverlay")!;
    ov.style.transition = "opacity 0.4s ease";
    setTimeout(() => ov.classList.remove("vis"), 30);

    const w = window as any;
    if (typeof w.setGlobeAutoRotate === "function") w.setGlobeAutoRotate(true);
  }

  function exitGlobeState() {
    if (appState !== "globe") return;

    const ov = document.getElementById("transOverlay")!;
    ov.style.transition = "opacity 0.45s ease";
    ov.classList.add("vis");

    setTimeout(() => {
      appState = "welcome";
      transLocked = false;

      cam.position.set(0, 0, 5);
      cam.lookAt(0, 0, 0);
      earthGrp.position.set(0, 0, -800);
      fl.style.opacity = "0";

      iconGrp.visible = true;
      iconGrp.scale.setScalar(1);
      iconGrp.rotation.set(0, 0, 0);
      (iconMesh.material as THREE.MeshBasicMaterial).opacity = 1;
      iconAlpha = 1;
      (orbits[0].material as THREE.PointsMaterial).opacity =
        orbits[0].userData.maxOp;
      (orbits[1].material as THREE.PointsMaterial).opacity =
        orbits[1].userData.maxOp;
      (glowSp.material as THREE.SpriteMaterial).opacity = 0.45;

      const hdr = document.getElementById("welcomeHdr");
      if (hdr) {
        hdr.style.opacity = "1";
        hdr.style.pointerEvents = "";
      }
      cz.style.display = "";
      cz.style.pointerEvents = "";

      document.body.classList.remove("globe-mode");

      const w = window as any;
      if (typeof w.setGlobeAutoRotate === "function") w.setGlobeAutoRotate(false);

      clk.getDelta();
      tick();

      ov.style.transition = "opacity 0.85s ease";
      setTimeout(() => ov.classList.remove("vis"), 80);
    }, 480);
  }

  const welcomeBackBtn = document.getElementById("welcomeBackBtn");
  welcomeBackBtn?.addEventListener("click", exitGlobeState);

  const onResize = () => {
    cam.aspect = W() / H();
    cam.updateProjectionMatrix();
    R.setSize(W(), H());
  };
  window.addEventListener("resize", onResize);

  /* Loader fade */
  setTimeout(() => {
    document.getElementById("ld")?.classList.add("go");
    setTimeout(() => document.getElementById("ld")?.remove(), 300);
  }, 100);

  if (startInGlobe) {
    const ov = document.getElementById("transOverlay")!;
    ov.style.transition = "none";
    ov.classList.add("vis");
    const loadingEl = document.getElementById("globeLoading");
    if (loadingEl) loadingEl.style.display = "block";
    iconGrp.visible = false;
    const hdr = document.getElementById("welcomeHdr");
    if (hdr) hdr.style.display = "none";
    const czEl = document.getElementById("cz");
    if (czEl) czEl.style.display = "none";
    tick();
  } else {
    setTimeout(() => goForward(), 1250);
    tick();
  }

  /* ─── Map ──────────────────────────────────────────────────── */
  /* Labels come from OpenFreeMap vector tiles (OpenMapTiles schema) so
     country names render in the active UI language and the polygon
     that OSM tags as "Israel" is hard-overridden to فلسطين / Palestine.
     The previous Esri reference raster baked English labels into pixels
     and could not be filtered. */
  const isIsraelFeature: any = [
    "any",
    ["==", ["get", "iso_a2"], "IL"],
    ["==", ["get", "name"], "Israel"],
    ["==", ["get", "name:en"], "Israel"],
  ];
  const labelTextField: any =
    locale === "ar"
      ? [
          "case",
          isIsraelFeature,
          "فلسطين",
          ["coalesce", ["get", "name:ar"], ["get", "name"]],
        ]
      : [
          "case",
          isIsraelFeature,
          "Palestine",
          ["coalesce", ["get", "name:en"], ["get", "name"]],
        ];

  const map = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      projection: { type: "globe" } as any,
      glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
      sources: {
        satellite: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: "Tiles © Esri — Maxar, Earthstar Geographics",
        },
        openmaptiles: {
          type: "vector",
          url: "https://tiles.openfreemap.org/planet",
        },
      },
      layers: [
        { id: "sat", type: "raster", source: "satellite" },
        {
          id: "country-borders",
          type: "line",
          source: "openmaptiles",
          "source-layer": "boundary",
          filter: [
            "all",
            ["==", ["get", "admin_level"], 2],
            ["!=", ["get", "maritime"], 1],
          ],
          paint: {
            "line-color": "rgba(255,255,255,0.45)",
            "line-width": 0.6,
          },
        },
        {
          id: "country-labels",
          type: "symbol",
          source: "openmaptiles",
          "source-layer": "place",
          filter: ["==", ["get", "class"], "country"],
          layout: {
            "text-field": labelTextField,
            "text-font": ["Noto Sans Regular"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              1, 10,
              4, 14,
              6, 18,
            ],
            "text-max-width": 8,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(0,0,0,0.7)",
            "text-halo-width": 1.4,
          },
        },
      ],
    } as any,
    center: [40, 25],
    zoom: 1.6,
    pitch: 0,
    attributionControl: true,
    antialias: true,
    maxTileCacheSize: 2000,
    refreshExpiredTiles: false,
  } as any);

  map.on("style.load", () => {
    try {
      (map as any).setProjection({ type: "globe" });
    } catch (err) {
      console.warn("globe projection not supported:", err);
    }
  });

  map.addControl(
    new maplibregl.NavigationControl({ visualizePitch: false }),
    "top-right",
  );

  map.dragRotate.disable();
  map.touchPitch.disable();
  map.touchZoomRotate.disableRotation();
  (map.keyboard as any).disableRotation();

  const mapEl = document.getElementById("map")!;
  map.on("mousedown", () => mapEl.classList.add("dragging"));
  map.on("mouseup", () => mapEl.classList.remove("dragging"));

  /* ─── Zoom-driven pin scale ─── */
  function pinScaleForZoom(z: number) {
    const t = Math.max(0, Math.min(1, z / 8));
    return 0.25 + 0.75 * t;
  }
  function updatePinScale() {
    document.documentElement.style.setProperty(
      "--pin-scale-global",
      pinScaleForZoom(map.getZoom()).toFixed(3),
    );
  }
  map.on("zoom", updatePinScale);
  map.once("load", updatePinScale);

  /* ─── Auto-rotate ─── */
  const SECONDS_PER_REV = 180;
  const SPIN_TICK_MS = 1000;
  const MAX_SPIN_ZOOM = 4;
  const WHEEL_IDLE_MS = 1500;
  let spinEnabled = true;
  let userInteracting = false;
  let wheelTimer: ReturnType<typeof setTimeout> | null = null;

  const spinInd = document.getElementById("spinInd")!;
  const spinOnSeg = spinInd.querySelector<HTMLElement>(
    '.gt-seg[data-spin="on"]',
  );
  const spinOffSeg = spinInd.querySelector<HTMLElement>(
    '.gt-seg[data-spin="off"]',
  );

  function applySpinState() {
    spinInd.classList.toggle("off", !spinEnabled);
    spinOnSeg?.classList.toggle("active", spinEnabled);
    spinOffSeg?.classList.toggle("active", !spinEnabled);
  }

  const setSpin = (on: boolean) => {
    if (spinEnabled === on) return;
    spinEnabled = on;
    applySpinState();
    if (spinEnabled) {
      spinGlobeTick();
    } else {
      try {
        map.stop();
      } catch {
        /* ignore */
      }
    }
  };
  spinOnSeg?.addEventListener("click", () => setSpin(true));
  spinOffSeg?.addEventListener("click", () => setSpin(false));

  function spinGlobeTick() {
    if (!spinEnabled || userInteracting) return;
    if (map.getZoom() > MAX_SPIN_ZOOM) return;
    if (
      map.isEasing() ||
      map.isMoving() ||
      map.isZooming() ||
      map.isRotating()
    )
      return;

    const distancePerSecond = (360 / SECONDS_PER_REV) * (SPIN_TICK_MS / 1000);
    const center = map.getCenter();
    center.lng -= distancePerSecond;
    try {
      map.easeTo({ center, duration: SPIN_TICK_MS, easing: (n) => n });
    } catch (err) {
      console.warn("spin easeTo failed", err);
    }
  }

  map.on("mousedown", () => {
    userInteracting = true;
  });
  map.on("touchstart", () => {
    userInteracting = true;
  });
  map.on("mouseup", () => {
    userInteracting = false;
    spinGlobeTick();
  });
  map.on("touchend", () => {
    userInteracting = false;
    spinGlobeTick();
  });

  map.on("moveend", () => {
    spinGlobeTick();
  });

  const onWheel = () => {
    userInteracting = true;
    if (wheelTimer) clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      userInteracting = false;
      spinGlobeTick();
    }, WHEEL_IDLE_MS);
  };
  map.getCanvasContainer().addEventListener("wheel", onWheel, { passive: true });

  /* ─── Pin canvas builders ─── */
  const flagUrl = (code: string) =>
    `https://flagcdn.com/w160/${(code || "").toLowerCase()}.png`;

  function loadImg(url: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("img load failed: " + url));
      i.src = url;
    });
  }

  async function flagPinCanvas(code: string) {
    const flag = await loadImg(flagUrl(code));
    const cv = document.createElement("canvas");
    cv.width = 96;
    cv.height = 112;
    const ctx = cv.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#fff";
    ctx.fill(new Path2D("M24 54 C24 54 44 32 44 20 A20 20 0 1 0 4 20 C4 32 24 54 24 54 Z"));
    ctx.restore();
    const cx = 24,
      cy = 20,
      r = 18;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.clip();
    const sc = (r * 2) / Math.max(flag.width, flag.height);
    ctx.drawImage(
      flag,
      cx - (flag.width * sc) / 2,
      cy - (flag.height * sc) / 2,
      flag.width * sc,
      flag.height * sc,
    );
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,.2)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    return cv;
  }

  function orgPinCanvas(letter: string) {
    const cv = document.createElement("canvas");
    cv.width = 96;
    cv.height = 112;
    const ctx = cv.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    const g = ctx.createLinearGradient(4, 0, 44, 40);
    g.addColorStop(0, "#b388ff");
    g.addColorStop(1, "#ffd700");
    ctx.fillStyle = g;
    ctx.fill(new Path2D("M24 54 C24 54 44 32 44 20 A20 20 0 1 0 4 20 C4 32 24 54 24 54 Z"));
    ctx.restore();
    const cx = 24,
      cy = 20,
      r = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#0a1128";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 16px Tajawal, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, cx, cy + 1);
    return cv;
  }

  const pinCanvases: Record<string, string> = {};

  /* Per-activity index built up-front so the panel can reuse it. */
  type IndexedActivity = {
    id: string;
    name: string;
    type: string;
    subtype: string | null;
    date: string;
    description?: string | null;
    images?: string[];
    lat: number;
    lng: number;
    entityCode: string;
    entityKind: "country" | "org";
    entity: {
      code: string;
      name: string;
      short: string;
      kind: "country" | "org";
      lat: number;
      lng: number;
    };
  };

  /* ─── Pins from activities.json ─────────────────────────────── */
  map.on("load", async () => {
    console.log("MapLibre version:", (maplibregl as any).version || "(unknown)");

    try {
      const ACT_OFFSET_KM: Record<string, number> = { country: 50, org: 5 };
      const GOLDEN = 2.39996;
      function offsetActivity(
        kind: "country" | "org",
        code: string,
        lat: number,
        lng: number,
        idx: number,
        total: number,
      ) {
        const r =
          (ACT_OFFSET_KM[kind] / 111) * Math.sqrt((idx + 0.5) / Math.max(total, 1));
        const seed = code ? code.charCodeAt(0) % 7 : 0;
        const ang = idx * GOLDEN + seed;
        return { lat: lat + r * Math.cos(ang), lng: lng + r * Math.sin(ang) };
      }
      function _entityMeta(e: Entity, kind: "country" | "org") {
        return {
          code: e.code,
          name: e.name,
          short: e.short || e.name,
          kind,
          lat: e.lat,
          lng: e.lng,
        };
      }
      const allActivities: IndexedActivity[] = [];
      function _indexEntity(e: Entity, kind: "country" | "org") {
        const acts = e.activities || [];
        acts.forEach((a, i) => {
          const hasCustom =
            typeof a.lat === "number" && typeof a.lng === "number";
          const point = hasCustom
            ? { lat: a.lat as number, lng: a.lng as number }
            : offsetActivity(kind, e.code, e.lat, e.lng, i, acts.length);
          allActivities.push({
            id: `${e.code}-${i}`,
            name: a.name,
            type: a.type,
            subtype: a.subtype,
            date: a.date,
            description: a.description,
            images: a.images,
            lat: point.lat,
            lng: point.lng,
            entityCode: e.code,
            entityKind: kind,
            entity: _entityMeta(e, kind),
          });
        });
      }
      (data.countries || []).forEach((c) => _indexEntity(c, "country"));
      (data.organizations || []).forEach((o) => _indexEntity(o, "org"));
      (data as any)._activities = allActivities;

      let activeEl: HTMLElement | null = null;

      /* Still exported via window.globeFlyHome so external callers (e.g.
         the activities panel) can reset the camera + pin selection. The
         on-screen "back to globe" button was removed — clicking pins
         and the activities list is the only remaining trigger. */
      function flyHome() {
        spinEnabled = true;
        applySpinState();
        if (activeEl) {
          activeEl.classList.remove("active");
          activeEl = null;
        }
        const w = window as any;
        if (typeof w.activitiesPanelClearHighlight === "function") {
          w.activitiesPanelClearHighlight();
        }
        map.flyTo({ center: [40, 25], zoom: 1.6, essential: true });
      }

      const OVERVIEW_ZOOM_THRESHOLD = 4;
      const PIN_TARGET_ZOOM = 5;

      function flyToPin(d: IndexedActivity, el: HTMLElement) {
        spinEnabled = false;
        applySpinState();

        if (activeEl) activeEl.classList.remove("active");
        activeEl = el;
        el.classList.add("active");

        userInteracting = true;

        const flyOpts: any = { center: [d.lng, d.lat], essential: true };
        if (map.getZoom() < OVERVIEW_ZOOM_THRESHOLD) {
          flyOpts.zoom = PIN_TARGET_ZOOM;
        }
        map.flyTo(flyOpts);

        const onArrive = () => {
          userInteracting = false;
          map.off("moveend", onArrive);
        };
        map.on("moveend", onArrive);
      }

      await Promise.all([
        ...data.countries.map(async (c) => {
          try {
            pinCanvases[c.code] = (await flagPinCanvas(c.code)).toDataURL();
          } catch {
            /* missing flag */
          }
        }),
        ...data.organizations.map((o) => {
          const letter = (o.short || o.name || "?").charAt(0);
          pinCanvases[o.code] = orgPinCanvas(letter).toDataURL();
        }),
      ]);

      const pinMarkers: Record<
        string,
        {
          marker: maplibregl.Marker;
          kind: "country" | "org";
          el: HTMLElement;
          entityCode: string;
        }
      > = {};

      /* Pin hover tooltip — shared element for all pins. Mirrors the panel's
         typeColor/typeLabel logic so the chip color matches what the user sees
         in the activities list. */
      const TYPE_META_PIN =
        data.activityTypes && typeof data.activityTypes === "object"
          ? data.activityTypes
          : {};
      const typesInDataPin = [
        ...new Set(allActivities.map((a) => a.type).filter(Boolean)),
      ];
      /* Brand palette accents — client-mandated hues cycled across types.
         Brand Green Primary leads since it matches the panel/tooltip
         background family. The API/seed `color` field is intentionally
         ignored: per project rules the brand palette wins at render time. */
      const BRAND_TYPE_PALETTE = [
        "#024e28", "#f5cc44", "#d56028", "#459aa8", "#193d58", "#57072d",
      ];
      const pinFallbackColor: Record<string, string> = {};
      typesInDataPin.forEach((tk, i) => {
        pinFallbackColor[tk] =
          BRAND_TYPE_PALETTE[i % BRAND_TYPE_PALETTE.length];
      });
      const pinTypeColor = (tk: string) =>
        pinFallbackColor[tk] || "#024e28";
      const pinTypeLabel = (tk: string) =>
        (TYPE_META_PIN[tk] && TYPE_META_PIN[tk].label) ||
        (tk || "").replace(/_/g, " ");
      const pinFlagUrl = (code: string) =>
        `https://flagcdn.com/w40/${(code || "").toLowerCase()}.png`;
      const escTip = (s: string) =>
        (s || "").replace(/[&<>"']/g, (ch) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[ch] as string,
        );

      const pinTip = document.createElement("div");
      pinTip.className = "pin-tip";
      pinTip.setAttribute("aria-hidden", "true");
      document.body.appendChild(pinTip);

      function buildTipHTML(act: IndexedActivity) {
        const color = pinTypeColor(act.type);
        const typeLab = pinTypeLabel(act.type);
        const dateTxt = act.date || t("noDate");
        const subtypeRow = act.subtype
          ? `<div class="pt-row"><span class="pt-label">${t("subtype")}</span><span class="pt-val">${escTip(act.subtype)}</span></div>`
          : "";
        const descHtml = act.description
          ? `<div class="pt-desc">${escTip(act.description)}</div>`
          : "";
        const imgs = (act.images ?? []).slice(0, 3);
        const imgsHtml = imgs.length
          ? `<div class="pt-imgs">${imgs
              .map(
                (u) =>
                  `<img src="${escTip(u)}" alt="" loading="lazy" onerror="this.style.display='none'">`,
              )
              .join("")}</div>`
          : "";
        const entityVisual =
          act.entityKind === "country"
            ? `<img src="${pinFlagUrl(act.entity.code)}" alt="" onerror="this.style.display='none'">`
            : `<span class="pt-dot" style="background:${color};box-shadow:0 0 6px ${color}"></span>`;
        return `
          <div class="pt-head" style="--accent:${color}">
            <span class="pt-type"><span class="dot"></span><span>${escTip(typeLab)}</span></span>
          </div>
          <div class="pt-title">${escTip(act.name)}</div>
          <div class="pt-rows">
            <div class="pt-row"><span class="pt-label">${t("activityType")}</span><span class="pt-val">${escTip(typeLab)}</span></div>
            <div class="pt-row"><span class="pt-label">${t("location")}</span><span class="pt-val pt-entity">${entityVisual}<span>${escTip(act.entity.short || act.entity.name)}</span></span></div>
            ${subtypeRow}
            <div class="pt-row"><span class="pt-label">${t("year")}</span><span class="pt-val">${escTip(dateTxt)}</span></div>
          </div>
          ${descHtml}
          ${imgsHtml}
        `;
      }

      function placeTip(clientX: number, clientY: number) {
        const pad = 14;
        const tw = pinTip.offsetWidth;
        const th = pinTip.offsetHeight;
        let x = clientX + 16;
        let y = clientY - th - 16;
        if (x + tw + pad > window.innerWidth) x = clientX - tw - 16;
        if (x < pad) x = pad;
        if (y < pad) y = clientY + 20;
        if (y + th + pad > window.innerHeight)
          y = window.innerHeight - th - pad;
        pinTip.style.left = `${x}px`;
        pinTip.style.top = `${y}px`;
      }

      let added = 0;
      allActivities.forEach((act) => {
        if (typeof act.lat !== "number" || typeof act.lng !== "number") return;
        if (!pinCanvases[act.entityCode]) return;
        const wrap = document.createElement("div");
        wrap.className = "pin-marker-wrap";
        const inner = document.createElement("div");
        inner.className = "pin-marker";
        inner.style.backgroundImage = `url(${pinCanvases[act.entityCode]})`;
        wrap.appendChild(inner);
        wrap.addEventListener("click", (ev) => {
          ev.stopPropagation();
          pinTip.classList.remove("show");
          const w = window as any;
          if (typeof w.activateActivity === "function") {
            w.activateActivity(act);
          } else {
            flyToPin(act, wrap);
          }
        });
        wrap.addEventListener("mouseenter", (ev) => {
          pinTip.innerHTML = buildTipHTML(act);
          pinTip.classList.add("show");
          placeTip(ev.clientX, ev.clientY);
        });
        wrap.addEventListener("mousemove", (ev) => {
          placeTip(ev.clientX, ev.clientY);
        });
        wrap.addEventListener("mouseleave", () => {
          pinTip.classList.remove("show");
        });
        const marker = new maplibregl.Marker({
          element: wrap,
          anchor: "bottom",
          opacityWhenCovered: "0",
        } as any)
          .setLngLat([act.lng, act.lat])
          .addTo(map);
        pinMarkers[act.id] = {
          marker,
          kind: act.entityKind,
          el: wrap,
          entityCode: act.entityCode,
        };
        added++;
      });
      console.log("Added " + added + " activity pins to globe");

      let activityFilterIds: Set<string> | null = null;
      function refreshPins() {
        Object.entries(pinMarkers).forEach(([id, entry]) => {
          const ok = !activityFilterIds || activityFilterIds.has(id);
          entry.el.style.display = ok ? "" : "none";
        });
      }
      const w = window as any;
      w.setActivityFilter = function (ids: Set<string> | null) {
        activityFilterIds = ids;
        refreshPins();
      };
      w.globeFlyToActivity = function (act: IndexedActivity) {
        if (!act || typeof act.lat !== "number" || typeof act.lng !== "number")
          return;
        const entry = pinMarkers[act.id];
        flyToPin(act, entry ? entry.el : document.createElement("div"));
      };
      w.globeFlyHome = flyHome;
      w.setGlobeAutoRotate = function (v: boolean) {
        spinEnabled = !!v;
        applySpinState();
        if (spinEnabled) spinGlobeTick();
        else {
          try {
            map.stop();
          } catch {
            /* ignore */
          }
        }
      };

      buildStats(data);
      initActivitiesPanel(data);

      spinGlobeTick();

      globeReady = true;
      if (startInGlobe) {
        const loading = document.getElementById("globeLoading");
        if (loading) loading.style.display = "none";
        enterGlobeState();
      }
    } catch (err) {
      console.error("Failed to load activities.json:", err);
      globeReady = true;
      if (startInGlobe) {
        const loading = document.getElementById("globeLoading");
        if (loading) loading.style.display = "none";
        enterGlobeState();
      }
    }
  });

  /* ============================================================
     STATS — premium card design backed by real JSON data
  ============================================================ */
  let _sd: { total: number; cc: number; oc: number } | null = null;

  function buildStats(d: ActivitiesData) {
    const allActs: Activity[] = [
      ...d.countries.flatMap((c) => c.activities || []),
      ...d.organizations.flatMap((o) => o.activities || []),
    ];
    const total = allActs.length;
    const byType: Record<string, number> = {};
    allActs.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    const cc = d.countries.length;
    const oc = d.organizations.length;

    const events = byType["الفعاليات"] || 0;
    const training = byType["التعليم_والتدريب"] || 0;
    const partners = byType["الشراكات_والاتفاقيات"] || 0;
    const research = byType["البحوث_العلمية_والكتب"] || 0;

    const regDef: Record<string, string[]> = {
      آسيا: [
        "cn", "in", "kz", "kr", "kg", "tm", "sg", "my", "mv", "tw", "tr",
        "tj", "jp", "id", "uz", "pk", "af", "bn", "bd", "th", "az",
      ],
      أوروبا: ["fr", "de", "gb", "es", "ba", "no", "it", "ro", "xk", "ru", "at", "by", "pl", "al"],
      "العالم العربي": ["sa", "ae", "qa", "kw", "om", "ma", "tn", "dz"],
      إفريقيا: ["et", "km", "za", "gn", "ke", "ng", "ug"],
    };
    const regionsCovered = Object.values(regDef).filter((codes) =>
      d.countries.some((c) => codes.includes(c.code)),
    ).length;

    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    type Card = {
      label: string;
      value: number;
      unit: string;
      variant: string;
    };

    /* Brand-palette ramp applied top-down on both columns:
       1 → #024E28, 2 → #082F18, 3 → #474747, 4 → #CECECE */
    const rightCards: Card[] = [
      { label: t("totalActivities"), value: total, unit: t("internationalActivity"), variant: "brand-1" },
      { label: t("participatingCountries"), value: cc, unit: t("country"), variant: "brand-2" },
      { label: t("internationalOrganizations"), value: oc, unit: t("organization"), variant: "brand-3" },
      { label: t("eventsAndConferences"), value: events, unit: t("event"), variant: "brand-4" },
    ];

    const leftCards: Card[] = [
      { label: t("educationAndTraining"), value: training, unit: t("program"), variant: "brand-1" },
      { label: t("partnershipsAndAgreements"), value: partners, unit: t("agreement"), variant: "brand-2" },
      { label: t("researchAndBooks"), value: research, unit: t("researchAndBookUnit"), variant: "brand-3" },
      { label: t("regionalCoverage"), value: regionsCovered, unit: t("geographicRegion"), variant: "brand-4" },
    ];

    function cardHTML(c: Card, i: number) {
      return `
        <div class="stat-card v-${c.variant}" style="--d:${i * 0.08}s" data-n="${c.value}">
          <span class="sc-label">${c.label}</span>
          <div class="sc-num-row">
            <span class="sc-value" data-target="${c.value}">0</span>
            <span class="sc-unit">${c.unit}</span>
          </div>
        </div>`;
    }

    document.getElementById("statsRight")!.innerHTML = rightCards.map(cardHTML).join("");
    document.getElementById("statsLeft")!.innerHTML = leftCards.map(cardHTML).join("");

    _sd = { total, cc, oc };
  }

  function animateStats() {
    if (!_sd) return;
    document.querySelectorAll<HTMLElement>(".stat-card").forEach((card, i) => {
      const valEl = card.querySelector<HTMLElement>(".sc-value");
      if (!valEl) return;

      const n = parseFloat(valEl.dataset.target || "0") || 0;
      valEl.textContent = "0";

      const baseDelay = 260 + i * 75;
      setTimeout(() => card.classList.add("ready"), 20 + i * 45);
      setTimeout(() => {
        const t0 = performance.now(),
          dur = 1400;
        const loop = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 4);
          valEl.textContent = fmtNum(Math.round(ease * n));
          if (p < 1) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }, baseDelay);
    });
  }

  /* ============================================================
     ACTIVITIES PANEL — filters + list rendering
  ============================================================ */
  function initActivitiesPanel(d: ActivitiesData) {
    const TYPE_META =
      d.activityTypes && typeof d.activityTypes === "object" ? d.activityTypes : {};

    function yearOf(date: string | null | undefined): number | null {
      if (!date || typeof date !== "string") return null;
      const m = date.match(/(19|20)\d{2}/);
      return m ? parseInt(m[0], 10) : null;
    }

    type FlatActivity = {
      id: string;
      name: string;
      type: string;
      subtype: string | null;
      date: string;
      year: number | null;
      lat: number;
      lng: number;
      entity: IndexedActivity["entity"];
    };

    const flat: FlatActivity[] = (((d as any)._activities as IndexedActivity[]) || []).map(
      (a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        date: a.date,
        year: yearOf(a.date),
        lat: a.lat,
        lng: a.lng,
        entity: a.entity,
      }),
    );

    const PAGE_SIZE = 8;
    const escapeAttr = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const cssEscape = (s: string) =>
      typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/"/g, '\\"');
    const state = {
      q: "",
      type: "all",
      subtype: "all",
      location: "all",
      year: "all",
      group: "none",
      highlightedActivityId: null as string | null,
      visibleCount: PAGE_SIZE,
    };

    const typesInData = [...new Set(flat.map((x) => x.type).filter(Boolean))];
    /* Brand palette accents — client-mandated hues cycled across types.
       Brand Green Primary leads since it matches the panel/tooltip
       background family. The API/seed `color` field is intentionally
       ignored: per project rules the brand palette wins at render time. */
    const BRAND_TYPE_PALETTE = [
      "#024e28", "#f5cc44", "#d56028", "#459aa8", "#193d58", "#57072d",
    ];
    const fallbackColorMap: Record<string, string> = {};
    typesInData.forEach((t, i) => {
      fallbackColorMap[t] = BRAND_TYPE_PALETTE[i % BRAND_TYPE_PALETTE.length];
    });
    const typeColor = (t: string) => fallbackColorMap[t] || "#024e28";
    const typeLabel = (t: string) =>
      (TYPE_META[t] && TYPE_META[t].label) || (t || "").replace(/_/g, " ");

    const locations: Array<{ code: string; label: string; kind: "country" | "org" }> = [
      ...d.countries.map((c) => ({
        code: c.code,
        label: c.short || c.name,
        kind: "country" as const,
      })),
      ...d.organizations.map((o) => ({
        code: o.code,
        label: o.short || o.name,
        kind: "org" as const,
      })),
    ];

    const ICON = {
      calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    };

    const typeChipsEl = document.getElementById("actTypeChips")!;
    const subtypeSection = document.getElementById("subtypeSection")!;
    const subtypeChipsEl = document.getElementById("actSubtypeChips")!;
    const locSel = document.getElementById("actLocationFilter") as HTMLSelectElement;
    const yearSel = document.getElementById("actYearFilter") as HTMLSelectElement;
    const groupEl = document.getElementById("actGroupBy")!;
    const listEl = document.getElementById("actList")!;
    const countEl = document.getElementById("actResultsCount")!;
    const searchEl = document.getElementById("actSearch") as HTMLInputElement;
    const activeFiltersEl = document.getElementById("actActiveFilters")!;

    function matchesExcept(a: FlatActivity, exclude: Set<string>) {
      const q = state.q.trim().toLowerCase();
      if (!exclude.has("type") && state.type !== "all" && a.type !== state.type) return false;
      if (!exclude.has("subtype") && state.subtype !== "all" && a.subtype !== state.subtype) return false;
      if (!exclude.has("location") && state.location !== "all") {
        const [kind, code] = state.location.split(":");
        const wantKind = kind === "c" ? "country" : "org";
        if (a.entity.kind !== wantKind || a.entity.code !== code) return false;
      }
      if (!exclude.has("year") && state.year !== "all") {
        if (state.year === "none") {
          if (a.year) return false;
        } else if (a.year !== parseInt(state.year, 10)) return false;
      }
      if (!exclude.has("q") && q && !(a.name || "").toLowerCase().includes(q)) return false;
      return true;
    }

    function applyFilters() {
      return flat.filter((a) => matchesExcept(a, new Set()));
    }

    function availableTypeCounts() {
      const scoped = flat.filter((a) => matchesExcept(a, new Set(["type", "subtype"])));
      const counts: Record<string, number> = {};
      scoped.forEach((x) => {
        counts[x.type] = (counts[x.type] || 0) + 1;
      });
      return { counts, total: scoped.length };
    }

    function availableSubtypeCounts() {
      const scoped = flat.filter((a) => matchesExcept(a, new Set(["subtype"])));
      const counts: Record<string, number> = {};
      scoped.forEach((x) => {
        if (x.subtype) counts[x.subtype] = (counts[x.subtype] || 0) + 1;
      });
      return { counts, total: Object.values(counts).reduce((s, n) => s + n, 0) };
    }

    function availableLocationCodes() {
      const scoped = flat.filter((a) => matchesExcept(a, new Set(["location"])));
      const set = new Set<string>();
      scoped.forEach((a) =>
        set.add(`${a.entity.kind === "country" ? "c" : "o"}:${a.entity.code}`),
      );
      return set;
    }

    function availableYearSet() {
      const scoped = flat.filter((a) => matchesExcept(a, new Set(["year"])));
      const ys = new Set<number>();
      let hasUndefined = false;
      scoped.forEach((a) => {
        if (a.year) ys.add(a.year);
        else hasUndefined = true;
      });
      return { years: [...ys].sort((a, b) => b - a), hasUndefined };
    }

    function renderTypeChips() {
      const { counts, total } = availableTypeCounts();

      if (state.type !== "all" && !counts[state.type]) {
        state.type = "all";
        state.subtype = "all";
      }

      const chips = [
        `<button type="button" class="ap-chip ${state.type === "all" ? "active" : ""}" data-v="all"
           style="--chipActive:rgba(2,78,40,.6);--chipBorder:rgba(2,78,40,.95);--chipColor:#fff">
           ${t("allActivities")}<span class="count">${fmtNum(total)}</span>
         </button>`,
      ];
      typesInData.forEach((t) => {
        const n = counts[t] || 0;
        if (n === 0 && state.type !== t) return;
        const color = typeColor(t);
        const active = state.type === t ? "active" : "";
        /* High alpha (cc/ee) for active fill/border so dark brand hues
           (#024e28, #193d58, #57072d) read against the green panel. */
        chips.push(`<button type="button" class="ap-chip ${active}" data-v="${t}"
          style="--chipActive:${color}cc;--chipBorder:${color}ee;--chipColor:#fff">
          <span class="swatch" style="--sw:${color}"></span>
          ${typeLabel(t)}<span class="count">${fmtNum(n)}</span>
        </button>`);
      });
      typeChipsEl.innerHTML = chips.join("");
    }

    function renderSubtypeChips() {
      const { counts, total } = availableSubtypeCounts();
      const subs = Object.keys(counts);

      if (subs.length === 0) {
        subtypeSection.style.display = "none";
        state.subtype = "all";
        return;
      }

      if (state.subtype !== "all" && !counts[state.subtype]) {
        state.subtype = "all";
      }

      subtypeSection.style.display = "block";
      const color = state.type !== "all" ? typeColor(state.type) : "#024e28";

      const chips = [
        `<button type="button" class="ap-chip ${state.subtype === "all" ? "active" : ""}" data-v="all"
           style="--chipActive:${color}cc;--chipBorder:${color}ee;--chipColor:#fff">
           ${t("all")}<span class="count">${fmtNum(total)}</span>
         </button>`,
        ...subs.map(
          (s) => `<button type="button" class="ap-chip ${state.subtype === s ? "active" : ""}" data-v="${s}"
            style="--chipActive:${color}cc;--chipBorder:${color}ee;--chipColor:#fff">
            ${s}<span class="count">${fmtNum(counts[s])}</span>
          </button>`,
        ),
      ];
      subtypeChipsEl.innerHTML = chips.join("");
    }

    function refreshSelects() {
      const availLoc = availableLocationCodes();
      const countryOpts = locations.filter(
        (l) => l.kind === "country" && availLoc.has(`c:${l.code}`),
      );
      const orgOpts = locations.filter(
        (l) => l.kind === "org" && availLoc.has(`o:${l.code}`),
      );

      let locHTML = `<option value="all">${t("allEntities")}</option>`;
      if (countryOpts.length) {
        locHTML +=
          `<optgroup label="${t("countries")}">` +
          countryOpts
            .map((l) => `<option value="c:${l.code}">${l.label}</option>`)
            .join("") +
          "</optgroup>";
      }
      if (orgOpts.length) {
        locHTML +=
          `<optgroup label="${t("organizations")}">` +
          orgOpts
            .map((l) => `<option value="o:${l.code}">${l.label}</option>`)
            .join("") +
          "</optgroup>";
      }
      locSel.innerHTML = locHTML;

      if (state.location !== "all" && !availLoc.has(state.location)) {
        state.location = "all";
      }
      locSel.value = state.location;

      const { years: availYears, hasUndefined } = availableYearSet();
      let yearHTML =
        `<option value="all">${t("allYears")}</option>` +
        availYears.map((y) => `<option value="${y}">${fmtYear(y)}</option>`).join("");
      if (hasUndefined) yearHTML += `<option value="none">${t("unspecified")}</option>`;
      yearSel.innerHTML = yearHTML;

      if (state.year !== "all") {
        const stillValid =
          (state.year === "none" && hasUndefined) ||
          availYears.includes(parseInt(state.year, 10));
        if (!stillValid) state.year = "all";
      }
      yearSel.value = state.year;
    }

    function flagUrlLocal(code: string) {
      return `https://flagcdn.com/w40/${(code || "").toLowerCase()}.png`;
    }

    /* Captured once so the same translated string is used everywhere we
       group/sort by "no date" — comparator equality must hold. */
    const NO_DATE_LABEL = t("noDate");

    function cardHTML(a: FlatActivity, idx: number) {
      const color = typeColor(a.type);
      const delay = Math.min(idx * 0.02, 0.4);
      const dateTxt = a.date || NO_DATE_LABEL;
      const entityFlag =
        a.entity.kind === "country"
          ? `<img class="flag" src="${flagUrlLocal(a.entity.code)}" alt="" onerror="this.style.display='none'">`
          : `<span class="entity-dot" style="color:${color}"></span>`;

      const subtypeMeta = a.subtype
        ? `<span class="ap-meta subtype">${ICON.tag}<span>${a.subtype}</span></span>`
        : "";

      const activeCls =
        state.highlightedActivityId === a.id ? " entity-active is-launching" : "";
      return `
        <article class="ap-card${activeCls}" role="button" tabindex="0"
                 data-activity-id="${a.id}"
                 aria-label="${t("openActivity")} ${a.name}"
                 style="--accent:${color}; animation-delay:${delay}s">
          <div class="ap-card-head">
            <span class="ap-type-tag">
              <span class="dot"></span>
              <span>${typeLabel(a.type)}</span>
            </span>
            <span class="ap-entity-tag" title="${a.entity.short}">
              ${entityFlag}<span>${a.entity.short}</span>
            </span>
          </div>
          <div class="ap-card-title">${a.name}</div>
          <div class="ap-card-foot">
            <span class="ap-meta">${ICON.calendar}<span>${dateTxt}</span></span>
            ${subtypeMeta}
          </div>
        </article>`;
    }

    function groupBy(items: FlatActivity[], key: string) {
      const map = new Map<string | number, FlatActivity[]>();
      items.forEach((x) => {
        let k: string | number;
        if (key === "year") k = x.year || NO_DATE_LABEL;
        else if (key === "entity") k = x.entity.short;
        else if (key === "type") k = typeLabel(x.type);
        else k = "";
        if (map.has(k)) map.get(k)!.push(x);
        else map.set(k, [x]);
      });
      return map;
    }

    function isFilterActive() {
      return (
        state.q.trim() !== "" ||
        state.type !== "all" ||
        state.subtype !== "all" ||
        state.location !== "all" ||
        state.year !== "all"
      );
    }

    function syncPinsToFilters(items: FlatActivity[]) {
      const w = window as any;
      if (typeof w.setActivityFilter !== "function") return;
      if (!isFilterActive()) {
        w.setActivityFilter(null);
        return;
      }
      const ids = new Set(items.map((a) => a.id));
      w.setActivityFilter(ids);
    }

    let _moreObserver: IntersectionObserver | null = null;
    function ensureMoreObserver() {
      if (_moreObserver) return _moreObserver;
      _moreObserver = new IntersectionObserver(
        (entries) => {
          /* Skip while the panel is closed: the list is still in the DOM
             (just translated off-screen), so the sentinel can read as
             "intersecting" and silently inflate visibleCount before the
             user has even opened the panel. */
          if (!document.body.classList.contains("viewing-activities")) return;
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            if (el.dataset.loading === "1") continue;
            el.dataset.loading = "1";
            /* Brief delay so the spinner is perceivable even though
               data is already in memory. */
            window.setTimeout(() => {
              const prevCount = state.visibleCount;
              state.visibleCount += PAGE_SIZE;
              /* Append-only path: existing card DOM nodes stay mounted so
                 there is no flicker when more items load. Full render() is
                 reserved for filter / group / search changes. */
              appendMore(prevCount);
            }, 280);
          }
        },
        { root: listEl.parentElement, rootMargin: "120px", threshold: 0.01 },
      );
      return _moreObserver;
    }

    const SENTINEL_HTML = () =>
      `<div class="ap-load-more" id="apLoadMore" aria-live="polite"><span class="spinner" aria-hidden="true"></span><span>${t("loadingMore")}</span></div>`;

    function attachSentinel() {
      listEl.insertAdjacentHTML("beforeend", SENTINEL_HTML());
      const sentinel = document.getElementById("apLoadMore");
      if (sentinel) ensureMoreObserver().observe(sentinel);
    }

    function removeSentinel() {
      const existing = document.getElementById("apLoadMore");
      if (existing) existing.remove();
    }

    function appendMore(prevCount: number) {
      const items = applyFilters();
      countEl.innerHTML = `<b>${fmtNum(items.length)}</b>${t("matchingActivity")}`;

      const newlyVisible = items.slice(prevCount, state.visibleCount);
      const hasMore = items.length > state.visibleCount;

      removeSentinel();

      if (newlyVisible.length === 0) {
        if (hasMore) attachSentinel();
        return;
      }

      if (state.group === "none") {
        const html = newlyVisible.map((a, i) => cardHTML(a, i)).join("");
        listEl.insertAdjacentHTML("beforeend", html);
      } else {
        /* Grouped append: place new cards into their existing group
           container (after the last card of that group, before the next
           group title) so existing DOM stays put. New groups appear at
           the end. */
        const fullGroups = groupBy(items, state.group);
        const newSet = new Set(newlyVisible.map((a) => a.id));

        for (const [k, arr] of fullGroups.entries()) {
          const newInGroup = arr.filter((a) => newSet.has(a.id));
          if (newInGroup.length === 0) continue;

          const cardsHTML = newInGroup
            .map((a, i) => cardHTML(a, i))
            .join("");
          const titleEl = listEl.querySelector<HTMLElement>(
            `.ap-group-title[data-group-key="${cssEscape(String(k))}"]`,
          );

          if (titleEl) {
            /* Insert before the next group title, or append at end. */
            let cursor: Element | null = titleEl.nextElementSibling;
            while (cursor && !cursor.classList.contains("ap-group-title")) {
              cursor = cursor.nextElementSibling;
            }
            if (cursor) cursor.insertAdjacentHTML("beforebegin", cardsHTML);
            else listEl.insertAdjacentHTML("beforeend", cardsHTML);
          } else {
            const titleHTML = `
              <div class="ap-group-title" data-group-key="${escapeAttr(String(k))}">
                <span>${state.group === "year" && typeof k === "number" ? fmtYear(k) : k}</span>
                <span class="badge">${fmtNum(arr.length)}</span>
              </div>`;
            listEl.insertAdjacentHTML("beforeend", titleHTML + cardsHTML);
          }
        }
      }

      if (hasMore) attachSentinel();
    }

    function render() {
      const items = applyFilters();
      countEl.innerHTML = `<b>${fmtNum(items.length)}</b>${t("matchingActivity")}`;
      syncPinsToFilters(items);

      if (!items.length) {
        listEl.innerHTML = `
          <div class="ap-empty">
            <div class="ap-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div class="ap-empty-t">${t("noResults")}</div>
            <div class="ap-empty-s">${t("noResultsHint")}</div>
          </div>`;
        return;
      }

      /* Ensure a highlighted activity (e.g. clicked from the globe) is
         within the visible window — otherwise the user sees the panel
         open with no card matching the pin they just clicked. */
      if (state.highlightedActivityId) {
        const idx = items.findIndex((a) => a.id === state.highlightedActivityId);
        if (idx >= state.visibleCount) {
          state.visibleCount = Math.ceil((idx + 1) / PAGE_SIZE) * PAGE_SIZE;
        }
      }

      const visible = items.slice(0, state.visibleCount);
      const hasMore = items.length > state.visibleCount;

      let html: string;
      if (state.group === "none") {
        html = visible.map((a, i) => cardHTML(a, i)).join("");
      } else {
        /* Compute groups from the full filtered set so each group title
           still shows its real total, but only render the slice that
           falls within the visible window. */
        const fullGroups = groupBy(items, state.group);
        const visibleSet = new Set(visible.map((a) => a.id));
        const sorted: Array<[string | number, FlatActivity[], FlatActivity[]]> = [
          ...fullGroups.entries(),
        ].map(([k, arr]) => [k, arr, arr.filter((a) => visibleSet.has(a.id))]);
        if (state.group === "year")
          sorted.sort((a, b) =>
            b[0] === NO_DATE_LABEL
              ? -1
              : a[0] === NO_DATE_LABEL
                ? 1
                : (b[0] as number) - (a[0] as number),
          );
        else sorted.sort((a, b) => b[1].length - a[1].length);

        html = sorted
          .filter(([, , vis]) => vis.length > 0)
          .map(
            ([k, fullArr, vis]) => `
            <div class="ap-group-title" data-group-key="${escapeAttr(String(k))}">
              <span>${state.group === "year" && typeof k === "number" ? fmtYear(k) : k}</span>
              <span class="badge">${fmtNum(fullArr.length)}</span>
            </div>
            ${vis.map((a, i) => cardHTML(a, i)).join("")}
          `,
          )
          .join("");
      }

      if (hasMore) {
        html += `<div class="ap-load-more" id="apLoadMore" aria-live="polite"><span class="spinner" aria-hidden="true"></span><span>${t("loadingMore")}</span></div>`;
      }

      listEl.innerHTML = html;

      if (hasMore) {
        const sentinel = document.getElementById("apLoadMore");
        if (sentinel) ensureMoreObserver().observe(sentinel);
      }
    }

    function rerenderAll() {
      state.visibleCount = PAGE_SIZE;
      renderTypeChips();
      renderSubtypeChips();
      refreshSelects();
      renderActiveFilters();
      render();
    }

    /* Build a removable chip per active filter (search query, type, subtype,
       location, year, group). Hidden entirely when nothing is active so the
       row doesn't add visual noise on the default state. Each chip carries a
       data-clear key the click handler maps back to a state reset. */
    function locationLabelFor(value: string): string {
      const opt = locSel.querySelector<HTMLOptionElement>(
        `option[value="${value.replace(/"/g, '\\"')}"]`,
      );
      return opt?.textContent ?? value;
    }
    function yearLabelFor(value: string): string {
      if (value === "none") return t("unspecified");
      const n = parseInt(value, 10);
      return Number.isFinite(n) ? fmtYear(n) : value;
    }
    function typeLabelFor(value: string): string {
      return TYPE_META[value]?.label || value.replace(/_/g, " ");
    }
    function groupLabelFor(value: string): string {
      if (value === "year") return t("groupYear");
      if (value === "entity") return t("groupEntity");
      if (value === "type") return t("groupType");
      return t("groupNone");
    }
    function chipHTML(
      labelKey: string,
      value: string,
      clear: string,
      ariaLabel: string,
    ) {
      return `
        <span class="ap-active-chip" data-active="${clear}">
          <span class="label">${escapeAttr(labelKey)}:</span>
          <span>${escapeAttr(value)}</span>
          <button type="button" data-clear="${clear}" aria-label="${escapeAttr(ariaLabel)}">×</button>
        </span>`;
    }
    function renderActiveFilters() {
      const chips: string[] = [];
      const q = state.q.trim();
      if (q) chips.push(chipHTML(t("searchLabel"), q, "q", t("clearFilter")));
      if (state.type !== "all") {
        chips.push(
          chipHTML(t("activityType"), typeLabelFor(state.type), "type", t("clearFilter")),
        );
      }
      if (state.subtype !== "all") {
        chips.push(
          chipHTML(t("subtype"), state.subtype, "subtype", t("clearFilter")),
        );
      }
      if (state.location !== "all") {
        chips.push(
          chipHTML(
            t("location"),
            locationLabelFor(state.location),
            "location",
            t("clearFilter"),
          ),
        );
      }
      if (state.year !== "all") {
        chips.push(
          chipHTML(t("year"), yearLabelFor(state.year), "year", t("clearFilter")),
        );
      }
      if (state.group !== "none") {
        chips.push(
          chipHTML(
            t("viewMode"),
            groupLabelFor(state.group),
            "group",
            t("clearFilter"),
          ),
        );
      }
      if (chips.length === 0) {
        activeFiltersEl.hidden = true;
        activeFiltersEl.innerHTML = "";
        return;
      }
      chips.push(
        `<button type="button" class="ap-active-chip clear-all" data-clear="all">${escapeAttr(t("clearAllFilters"))}</button>`,
      );
      activeFiltersEl.hidden = false;
      activeFiltersEl.innerHTML = chips.join("");
    }
    activeFiltersEl.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-clear]");
      if (!target) return;
      const key = target.dataset.clear;
      if (!key) return;
      if (key === "all" || key === "q") {
        state.q = "";
        searchEl.value = "";
      }
      if (key === "all" || key === "type") {
        state.type = "all";
        state.subtype = "all";
      }
      if (key === "all" || key === "subtype") state.subtype = "all";
      if (key === "all" || key === "location") state.location = "all";
      if (key === "all" || key === "year") state.year = "all";
      if (key === "all" || key === "group") {
        state.group = "none";
        groupEl
          .querySelectorAll<HTMLElement>("button")
          .forEach((b) => b.classList.toggle("active", b.dataset.v === "none"));
      }
      rerenderAll();
    });

    typeChipsEl.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(".ap-chip");
      if (!btn) return;
      state.type = btn.dataset.v || "all";
      state.subtype = "all";
      rerenderAll();
    });
    subtypeChipsEl.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(".ap-chip");
      if (!btn) return;
      state.subtype = btn.dataset.v || "all";
      rerenderAll();
    });
    searchEl.addEventListener("input", (e) => {
      state.q = (e.target as HTMLInputElement).value;
      rerenderAll();
    });
    locSel.addEventListener("change", (e) => {
      state.location = (e.target as HTMLSelectElement).value;
      rerenderAll();
    });
    yearSel.addEventListener("change", (e) => {
      state.year = (e.target as HTMLSelectElement).value;
      rerenderAll();
    });

    groupEl.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("button");
      if (!btn) return;
      state.group = btn.dataset.v || "none";
      state.visibleCount = PAGE_SIZE;
      groupEl
        .querySelectorAll<HTMLElement>("button")
        .forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });

    function activateActivity(act: FlatActivity | IndexedActivity) {
      if (!act || !act.id) return;
      if (typeof act.lat !== "number" || typeof act.lng !== "number") return;

      if (state.highlightedActivityId === act.id) {
        try {
          const w = window as any;
          if (typeof w.globeFlyHome === "function") w.globeFlyHome();
        } catch {
          /* ignore */
        }
        return;
      }

      state.highlightedActivityId = act.id;

      if (!document.body.classList.contains("viewing-activities")) {
        openPanel();
      } else {
        /* Re-render so the highlighted card is guaranteed to be in the
           DOM (render() auto-bumps visibleCount to include it) and to
           apply entity-active / is-launching consistently. */
        render();
        const firstMatch = listEl.querySelector<HTMLElement>(
          `.ap-card[data-activity-id="${act.id}"]`,
        );
        if (firstMatch)
          firstMatch.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
      }

      try {
        const w = window as any;
        if (typeof w.globeFlyToActivity === "function") {
          w.globeFlyToActivity(act);
        }
      } catch {
        /* ignore */
      }
    }
    (window as any).activateActivity = activateActivity;

    function activateFromCard(card: HTMLElement) {
      const id = card.dataset.activityId;
      if (!id) return;
      const act = flat.find((a) => a.id === id);
      if (act) activateActivity(act);
    }

    listEl.addEventListener("click", (e) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".ap-card");
      if (!card) return;
      activateFromCard(card);
    });
    listEl.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = (e.target as HTMLElement).closest<HTMLElement>(".ap-card");
      if (!card) return;
      e.preventDefault();
      activateFromCard(card);
    });

    /* "/" focuses the search input from anywhere on the globe page (when the
       activities panel is open and the user isn't already typing). Mirrors
       the convention from GitHub/Linear for keyboard-driven exploration. */
    document.addEventListener("keydown", (e) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!document.body.classList.contains("viewing-activities")) return;
      e.preventDefault();
      searchEl.focus();
      searchEl.select();
    });

    document.getElementById("actResetBtn")!.addEventListener("click", () => {
      state.q = "";
      state.type = "all";
      state.subtype = "all";
      state.location = "all";
      state.year = "all";
      state.group = "none";
      state.highlightedActivityId = null;
      searchEl.value = "";
      groupEl
        .querySelectorAll<HTMLElement>("button")
        .forEach((b) => b.classList.toggle("active", b.dataset.v === "none"));
      rerenderAll();
    });

    const openBtn = document.getElementById("activitiesToggleBtn")!;
    const closeBtn = document.getElementById("activitiesCloseBtn")!;
    const panelEl = document.getElementById("activitiesPanel")!;

    let _panelResizeRaf: number | null = null;
    function smoothResizeMap() {
      if (_panelResizeRaf) cancelAnimationFrame(_panelResizeRaf);
      const dur = 900;
      const start = performance.now();
      const loop = () => {
        try {
          map.resize();
        } catch {
          /* ignore */
        }
        if (performance.now() - start < dur) {
          _panelResizeRaf = requestAnimationFrame(loop);
        }
      };
      _panelResizeRaf = requestAnimationFrame(loop);
    }

    /* Compute the padding the map should reserve on the panel side so the
       globe slides smoothly to the opposite side when the panel opens.
       Matches the panel width + right offset (.act-panel: width min(420,38vw)
       + right:16). Below 901px the panel is full-width over the map, so no
       shift needed (returns 0). */
    function panelPadding(): number {
      if (window.innerWidth < 901) return 0;
      const w = Math.min(420, window.innerWidth * 0.38);
      return Math.round(w + 16 + 16);
    }

    function openPanel() {
      document.body.classList.add("viewing-activities");
      panelEl.setAttribute("aria-hidden", "false");
      try {
        const w = window as any;
        if (typeof w.setGlobeAutoRotate === "function") w.setGlobeAutoRotate(false);
      } catch {
        /* ignore */
      }
      try {
        map.easeTo({
          padding: { right: panelPadding(), top: 0, bottom: 0, left: 0 },
          duration: 850,
          easing: (n) => 1 - Math.pow(1 - n, 3),
        });
      } catch {
        /* ignore */
      }
      render();
      smoothResizeMap();
      if (state.highlightedActivityId) {
        setTimeout(() => {
          const firstMatch = listEl.querySelector<HTMLElement>(".ap-card.is-launching");
          if (firstMatch)
            firstMatch.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 350);
      }
    }

    (window as any).activitiesPanelClearHighlight = function () {
      state.highlightedActivityId = null;
      listEl
        .querySelectorAll<HTMLElement>(".entity-active")
        .forEach((c) => c.classList.remove("entity-active"));
      listEl
        .querySelectorAll<HTMLElement>(".is-launching")
        .forEach((c) => c.classList.remove("is-launching"));
    };

    function closePanel() {
      document.body.classList.remove("viewing-activities");
      panelEl.setAttribute("aria-hidden", "true");
      listEl
        .querySelectorAll<HTMLElement>(".is-launching")
        .forEach((c) => c.classList.remove("is-launching"));
      try {
        const w = window as any;
        if (typeof w.setGlobeAutoRotate === "function") w.setGlobeAutoRotate(true);
      } catch {
        /* ignore */
      }
      try {
        map.easeTo({
          padding: { right: 0, top: 0, bottom: 0, left: 0 },
          duration: 850,
          easing: (n) => 1 - Math.pow(1 - n, 3),
        });
      } catch {
        /* ignore */
      }
      const w = window as any;
      if (typeof w.setActivityFilter === "function") w.setActivityFilter(null);
      smoothResizeMap();
    }

    openBtn.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("viewing-activities"))
        closePanel();
    });

    rerenderAll();
  }

  map.on("error", (ev) => {
    console.error("Map error:", ev);
  });

  /* ── Cleanup: cancel render loop, remove map, drop window globals,
        and unbind window-level listeners. The component-level useEffect
        also strips the body classes (.globe-page-active / .globe-mode /
        .viewing-activities) that may have been added during the session. */
  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    window.removeEventListener("resize", onResize);
    document.removeEventListener("mousemove", onMouseMove);
    try {
      map.remove();
    } catch {
      /* ignore */
    }
    try {
      R.dispose();
    } catch {
      /* ignore */
    }
    document.body.classList.remove("globe-mode", "viewing-activities");
    document.querySelector(".pin-tip")?.remove();
    const w = window as any;
    delete w.activateActivity;
    delete w.activitiesPanelClearHighlight;
    delete w.setActivityFilter;
    delete w.globeFlyToActivity;
    delete w.globeFlyHome;
    delete w.setGlobeAutoRotate;
  };
}
