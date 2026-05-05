# CLAUDE.md

## Project overview

Interactive globe app for **مجمع الملك سلمان العالمي للغة العربية** (King Salman Global Academy for Arabic Language) showcasing international activities on a 3D globe.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Prisma v7 (SQLite) · next-intl (ar/en) · Zustand · MapLibre GL JS · Three.js

## Commands

```bash
npm run dev      # dev server → http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

**Prisma:**
```bash
node node_modules/prisma/build/index.js migrate dev   # run migrations
node node_modules/prisma/build/index.js generate       # regenerate client
```

> Prisma CLI binary may not be in `.bin`; use `node node_modules/prisma/build/index.js` if `npx prisma` fails.

## Architecture

```
src/
  app/
    page.tsx              → redirects to /ar
    [locale]/
      layout.tsx          → NextIntlClientProvider, html lang/dir
      page.tsx            → renders <GlobeApp />
    globals.css           → all app CSS (no CSS modules)
  components/
    GlobeApp.tsx          → main client orchestrator; all children are dynamic(ssr:false)
    welcome/WelcomeScene.tsx  → Three.js stars + logo canvas
    globe/GlobeMap.tsx        → MapLibre GL globe, pin markers, auto-rotate
    stats/StatsColumn.tsx     → animated stat cards (left/right sides)
    activities/ActivitiesPanel.tsx  → filter + activity list panel
    ui/LanguageSwitcher.tsx   → AR/EN locale toggle
  stores/
    globe.ts        → appState, globeReady, spinEnabled, activeActivity
    activities.ts   → panelOpen, filters (type/subtype/location/year/groupBy)
    ui.ts           → locale
  lib/
    types.ts        → all shared TypeScript types
    activities.ts   → buildActivities() — golden-angle spiral pin offset logic
    prisma.ts       → Prisma singleton (dev-safe global)
  i18n/
    routing.ts      → defineRouting({ locales: ['ar','en'], defaultLocale: 'ar' })
    request.ts      → getRequestConfig (server-side message loading)
    navigation.ts   → createNavigation(routing) → Link, useRouter, usePathname
  generated/prisma/ → Prisma v7 generated client (do not edit)
messages/
  ar.json / en.json → all UI strings
prisma/
  schema.prisma     → Country, Organization, Activity models
prisma.config.ts    → Prisma v7 datasource config (reads DATABASE_URL)
middleware.ts       → next-intl locale routing
```

## Key patterns

**SSR safety:** All canvas/map/WebGL components use `dynamic(() => import(...), { ssr: false })`. Never remove this — they use browser-only APIs.

**Cross-component communication:**
- `globe:data` CustomEvent — GlobeMap dispatches after loading activities.json; StatsColumn and ActivitiesPanel listen for it
- `window.setActivityFilter(ids)` — ActivitiesPanel calls to show/hide map pins
- `window.globeFlyToActivity(act)` — ActivitiesPanel calls to fly map to a pin
- `window.globeFlyHome()` — resets map to default view

**Body classes:** GlobeApp syncs `welcome-mode`, `globe-mode`, and `viewing-activities` on `document.body`; CSS uses these to gate visibility of UI elements.

**App state flow:** Initial `appState` is `'welcome'`. WelcomeScene owns the canvas click + zoom transition: click → `'trans_fwd'` (3.2s; logo shrinks → camera warps forward through staggered meteor streaks → white flash) → `'globe'`. The Three.js render loop keeps running in `'globe'` so stars remain a backdrop; only the logo/orbits hide. `welcomeBackBtn` returns to `'welcome'` and WelcomeScene restores logo pose. GlobeMap never sets `'globe'` itself — it just sets `globeReady` once activities load (the click is gated on `globeReady`).

**Locale routing:** Middleware handles `/` → `/ar` and `/en/*` routing. The root `page.tsx` also hard-redirects to `/ar` as a fallback.

**Prisma v7 notes:**
- No `url` field in `schema.prisma` datasource — URL is set in `prisma.config.ts` via `DATABASE_URL` env var
- Generated client is at `src/generated/prisma/client.ts` (not `src/generated/prisma/index.ts`)
- `new PrismaClient()` requires a datasource arg in v7 — use `new (PrismaClient as any)()` in the singleton

**Activity pin layout:** `buildActivities()` in `src/lib/activities.ts` offsets multiple activities from the same entity using a golden-angle spiral (50 km radius for countries, 5 km for orgs) to prevent pin overlap.

## Data

Globe data is served statically from `public/data/activities.json`. The Prisma database is intended for a future admin panel (CRUD for activities, countries, organizations). Set `DATABASE_URL` in `.env` to a SQLite file path, e.g.:

```
DATABASE_URL="file:./dev.db"
```

## Locales

- Default locale: `ar` (RTL, `dir="rtl"`)
- Secondary locale: `en` (LTR, `dir="ltr"`)
- Add translation keys to both `messages/ar.json` and `messages/en.json`
- Namespaces: `common`, `language`, `globe`, `stats`, `activities`

## Deployment

Docker + Docker Compose. See `docs/infrastructure-document.html` for full infra details.
