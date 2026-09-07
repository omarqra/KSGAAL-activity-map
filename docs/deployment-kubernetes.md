# Deployment — Kubernetes

This document describes how `ksgaal-activity-map` is deployed to Kubernetes
(target: Azure AKS with the ingress-nginx controller) and how Azure DevOps
builds and ships the image.

## Architecture at a glance

- **Single Next.js 16 app** (App Router). Public website, admin dashboard,
  and all `/api/**` routes run in the **same** Node process.
- **No separate backend service.** The admin dashboard lives at
  `/[locale]/dashboard/**` inside the same Next.js app and is protected
  by a session cookie issued by `/api/auth/login` (password + email OTP 2FA).
- **PostgreSQL is external** — in production it is a managed database
  (e.g. Azure Database for PostgreSQL Flexible Server). The pods themselves
  are stateless.
- **SMTP is required in production** for OTP emails and password-reset links.
- **Docker Compose is for local testing only** (see `docker-compose.yml`).
  Kubernetes is the production deployment model.

## Runtime architecture

```mermaid
flowchart LR
  USERS[Users / Admins]
  DNS[(DNS<br/>example.com)]
  ING[NGINX Ingress Controller<br/>TLS termination]
  SVC[Service<br/>ksgaal-activity-map<br/>ClusterIP :80]
  subgraph DEP[Deployment ksgaal-activity-map]
    P1[Pod app-1<br/>Next.js :3000]
    P2[Pod app-2<br/>Next.js :3000]
  end
  CM[(ConfigMap<br/>non-secret env)]
  SEC[(Secret<br/>DATABASE_URL, JWT_SECRET, SMTP_*, ADMIN_*)]
  JOB[Job: prisma migrate deploy]
  PG[(PostgreSQL<br/>managed, external)]
  SMTP[(SMTP)]

  USERS --> DNS --> ING --> SVC
  SVC --> P1
  SVC --> P2
  CM --> P1
  CM --> P2
  SEC --> P1
  SEC --> P2
  JOB --> PG
  P1 --> PG
  P2 --> PG
  P1 --> SMTP
  P2 --> SMTP
```

## Public request flow

```mermaid
sequenceDiagram
  participant U as Visitor browser
  participant ING as NGINX Ingress
  participant N as Next.js Pod (RSC)
  participant CACHE as unstable_cache (tag globe:data, 60s)
  participant DB as PostgreSQL

  U->>ING: GET https://example.com/
  ING->>N: forward
  N->>N: middleware (next-intl) -> redirect to /ar
  U->>ING: GET https://example.com/ar
  ING->>N: forward
  N->>CACHE: getGlobeData()
  alt cache miss
    CACHE->>DB: SELECT countries, organizations, activityTypes, activities
    DB-->>CACHE: rows
    CACHE-->>N: GlobeData
  else cache hit
    CACHE-->>N: GlobeData (cached)
  end
  N-->>U: SSR HTML + client JS (MapLibre / Three.js)
```

## Admin request flow

```mermaid
sequenceDiagram
  participant A as Admin browser
  participant ING as NGINX Ingress
  participant N as Next.js Pod
  participant API as /api/admin/*
  participant DB as PostgreSQL
  participant MAIL as SMTP

  A->>ING: POST /api/auth/login {email,password}
  ING->>N: forward
  N->>N: rate-limit + lockout + bcrypt verify
  N->>DB: SELECT user, INSERT LoginAttempt + AuditLog
  N->>MAIL: send 6-digit OTP
  N-->>A: Set-Cookie otp_challenge (JWT), {requires2FA:true}

  A->>N: POST /api/auth/otp/verify {code}
  N->>DB: verify OtpCode, INSERT AuditLog
  N-->>A: Set-Cookie session (JWT, HttpOnly)

  A->>N: GET /ar/dashboard
  N->>N: requireUser() reads session cookie
  N->>DB: SELECT user
  N-->>A: SSR dashboard

  A->>N: POST /api/admin/activities {...}
  N->>N: requireApiRole(['admin','editor'])
  N->>DB: INSERT Activity + AuditLog
  N->>N: revalidateTag('globe:data')
  N-->>A: 201 Created
```

## Azure DevOps deployment flow

```mermaid
flowchart LR
  DEV[Developer push] --> REPO[(Azure Repos / GitHub)]
  REPO --> VAL[Stage 1: Validate<br/>npm ci, lint, ts-check, build]
  VAL --> BUILD[Stage 2: BuildAndPush<br/>docker buildAndPush]
  BUILD --> ACR[(Azure Container Registry)]
  ACR --> STAGE{Branch?}
  STAGE -- refs/heads/staging --> DS[Stage 3: DeployStaging<br/>env: staging<br/>auto-deploy]
  STAGE -- refs/heads/main --> DP[Stage 4: DeployProduction<br/>env: production<br/>manual approval]
  DS --> AKS_S[(AKS namespace ksgaal<br/>staging cluster)]
  DP --> AKS_P[(AKS namespace ksgaal<br/>production cluster)]
```

Each deploy stage:

1. Substitutes `ACR_LOGIN_SERVER` and `IMAGE_TAG` placeholders in
   `k8s/deployment.yaml` and `k8s/migration-job.yaml`.
2. Creates/updates the Secret from Azure DevOps variable group
   (linked to Key Vault).
3. Applies namespace + ConfigMap + Service + Ingress.
4. Runs `prisma migrate deploy` as a Kubernetes Job and waits for it to
   complete.
5. Applies the Deployment and waits for the rollout to finish.

## Health probes

- **Liveness:** `GET /api/health/live` — static 200, no DB.
- **Readiness:** `GET /api/health/ready` — runs `SELECT 1` against
  PostgreSQL; returns 503 if unreachable.
- The pre-existing `/api/admin/health` endpoint requires a session cookie
  and **must not** be used as a probe.

## What lives where

| Concern | Where |
|---|---|
| Non-secret env (URLs, SMTP host, public vars) | `k8s/configmap.yaml` |
| Secret env (DB URL, JWT, SMTP creds, admin seed) | K8s Secret created from Azure Key Vault / DevOps secret variables |
| Image | Azure Container Registry, tag = `$(Build.BuildId)` |
| TLS cert | Secret `ksgaal-tls` in `ksgaal` namespace (cert-manager or manual) |
| Migrations | One-shot Job per release, runs `npx prisma migrate deploy` |

## Local testing vs production

| | Local (`docker compose up`) | Production (K8s) |
|---|---|---|
| Database | `postgres:16-alpine` container | Managed PostgreSQL (e.g. Azure DB for PostgreSQL) |
| SMTP | Mailpit (`localhost:8025`) | Real SMTP provider |
| Secrets | Hard-coded in compose file (placeholders) | Kubernetes Secret from Azure Key Vault |
| HA | Single replica | 2+ replicas, rolling updates |
| TLS | None (HTTP on `localhost:3000`) | Ingress + cert-manager |

Use Docker Compose to smoke-test the production image locally. Never use it
to host the live app.
