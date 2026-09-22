# syntax=docker/dockerfile:1.7
# Multi-stage build for the Next.js 16 (App Router) + Prisma 6 app.
# Final image uses Next.js standalone output and runs as a non-root user.

# ---------- base ----------
FROM node:20-alpine AS base
# libc6-compat is needed by some native Node deps (Prisma engine, sharp, etc.)
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production


# ---------- deps ----------
# Install full dependencies (incl. devDependencies needed for `next build`).
FROM base AS deps
ENV NODE_ENV=development
# The academy's build agent is memory-starved and its kernel OOM-killed an
# uncapped `npm ci` (exit 137). Capping V8's heap keeps installs and builds
# inside the machine's real budget; override with --build-arg on roomier hosts.
ARG NODE_HEAP_MB=2048
ENV NODE_OPTIONS=--max-old-space-size=${NODE_HEAP_MB}
ENV HUSKY=0
COPY package.json package-lock.json* ./
# Prisma postinstall calls `prisma generate` and needs the schema.
COPY prisma ./prisma
RUN npm ci --prefer-offline --no-audit --no-fund --maxsockets 3


# ---------- builder ----------
# Build the Next.js app and generate the Prisma client.
FROM base AS builder
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Same heap cap as the deps stage — `next build` is the heaviest step of all.
ARG NODE_HEAP_MB=2048
ENV NODE_OPTIONS=--max-old-space-size=${NODE_HEAP_MB}

# Build-time public env (baked into the client bundle). Override at build time
# with `--build-arg NEXT_PUBLIC_FRONTEND_URL=...` etc.
ARG NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
ENV NEXT_PUBLIC_FRONTEND_URL=${NEXT_PUBLIC_FRONTEND_URL}
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}

# `src/env/server.ts` validates env at build time. Provide safe defaults so the
# build does not fail; real values are injected at runtime in the container.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV JWT_SECRET=build-time-placeholder-not-used-at-runtime-123456

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

RUN npm run build

# Bundle the database bootstrap to plain JavaScript.
#
# The runner image has Node and the generated Prisma client but no TypeScript
# loader, so `tsx prisma/...` cannot run there. Bundling here keeps a single
# source of truth: the migration Job executes the same seedRoles/seedAdminUser
# used locally, rather than a hand-copied duplicate that drifts.
#
# `@prisma/client` stays external because the runner gets it by explicit COPY.
# bcryptjs is bundled in on purpose — Next.js compiles server dependencies
# into its own chunks, so it is NOT present as a resolvable module in the
# standalone output.
#
# esbuild comes in transitively with tsx. If that ever stops being true this
# RUN fails the build outright, which is the right way to find out.
RUN npx esbuild prisma/bootstrap.ts \
      --bundle --platform=node --format=cjs --target=node20 \
      --outfile=/app/prisma-dist/bootstrap.cjs \
      --external:@prisma/client --external:.prisma


# ---------- prisma CLI ----------
# A standalone, correctly resolved Prisma CLI for the migration Job.
#
# Copying node_modules/prisma out of the build does not work: the CLI loads
# @prisma/config, which pulls in effect, c12 and their own trees, none of
# which live under the @prisma scope. The migration Job died three times on
# `Cannot find module 'effect'`, and chasing the missing packages one by one
# turned up four more before the next one appeared — that list is a property
# of the CLI's internals and would rot on any upgrade.
#
# A clean install resolves the whole closure properly: 35 packages, ~131 MB,
# against 1.4 GB for the full node_modules. The version is read from the lock
# file rather than written here, so it cannot drift from what the app is
# built against.
FROM base AS prismacli
WORKDIR /cli
COPY package.json package-lock.json* ./
RUN PRISMA_VERSION=$(node -p "require('./package-lock.json').packages['node_modules/prisma'].version") \
 && echo "Installing prisma@${PRISMA_VERSION} (from package-lock.json)" \
 && rm -f package.json package-lock.json \
 && npm init -y > /dev/null \
 && npm install --omit=dev --no-audit --no-fund "prisma@${PRISMA_VERSION}"


# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S -u 1001 -G nodejs nextjs

# Next.js standalone output is the minimal server runtime.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma assets needed at runtime:
#  - `prisma/schema.prisma` + `prisma/migrations/`  → so the same image can run
#    the migrate Job via `npx prisma migrate deploy`.
#  - `prisma-cli/` → the standalone CLI from the stage above, used only by
#    the migration Job.
#  - `node_modules/@prisma` (engines + generated client) → Next.js standalone
#    copies only what its tracer sees, so Prisma is added explicitly.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma-dist ./prisma-dist
COPY --from=prismacli --chown=nextjs:nodejs /cli/node_modules ./prisma-cli/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000

# Standalone entrypoint produced by `next build` when `output: "standalone"`.
CMD ["node", "server.js"]
