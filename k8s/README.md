# Kubernetes manifests — `ksgaal-activity-map`

Manifests for deploying the Next.js app to the academy's internal Kubernetes
cluster, reached through the `development-AATW` service connection.

The pipeline's service account (`azdevops-dev`) has full rights **inside the
`dev` namespace only** and none at cluster scope — so nothing here creates a
Namespace, and `dev` is assumed to already exist.

PostgreSQL runs **inside the cluster**, in the same namespace — see the
Database section below. It can be pointed at an external database instead,
and the app also starts with no database at all.

Note for anyone debugging a stuck pull: the cluster's nodes have **no outbound
internet**. A probe run on 2026-09-09 had them time out reaching `ghcr.io`, so
the academy's own registry is the only one they can pull from.

## Directory structure

```
k8s/
├── base/                        # Shared resources (no namespace set)
│   ├── kustomization.yaml
│   ├── configmap.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── deployment.yaml          # Applied by pipeline after migration, not by kustomize
│   └── migration-job.yaml       # Applied by pipeline before deployment, not by kustomize
├── overlays/
│   └── dev/
│       ├── kustomization.yaml   # namespace: dev (no Namespace resource)
│       ├── configmap-patch.yaml # APP_ENV=dev, placeholder APP_URL
│       ├── ingress-patch.yaml   # dev.example.com, TLS secret ksgaal-dev-tls
│       ├── postgres.yaml        # In-cluster database — applied by pipeline, not kustomize
│       └── nodeport-service.yaml # Temporary way in — applied by pipeline, not kustomize
├── secret.example.yaml          # Documentation template only — NOT applied by kustomize
└── README.md
```

`deployment.yaml` and `migration-job.yaml` live in `base/` but are **not
listed** in `base/kustomization.yaml`. The pipeline applies them explicitly
after namespace setup and after migrations complete — this enforces the correct
ordering and lets the pipeline halt on migration failure before touching the
running Deployment.

## Namespace

| Environment   | Namespace |
|---------------|-----------|
| `development` | `dev`     |

`dev` is owned and created by the academy.

## Registry

Images live in Oracle Cloud's registry in Jeddah, in the repository the
academy allocated on 2026-09-20:

```
jed.ocir.io/axzbw7rafu2r/aatw/dev:<buildId>
```

Both pod specs carry the single placeholder `IMAGE_REF`, which the pipeline
substitutes with that full reference at deploy time. It is one token rather
than a host and a tag stitched together, because the repository name belongs
to the academy and an earlier split version kept silently pointing at the old
one after they renamed it.

The repository is private, so both pod specs reference an `ocir-pull-secret`.
The pipeline mints it in `dev` on every run from the `Docker_AATW` registry
service connection, so it does not need to exist beforehand, and no registry
username or token is stored in this repo or in a variable group.

## Reaching the app

The Ingress cannot route yet — its host (`dev.example.com`) and TLS secret
(`ksgaal-dev-tls`) are placeholders standing in for values the academy has not
supplied, and the normal Service is ClusterIP.

As a stopgap the pipeline applies `overlays/dev/nodeport-service.yaml` while
the `exposeNodePort` variable is `true`, and prints
`http://<node-ip>:<port>` at the end of the deploy. That address works from
anywhere inside the academy's network, over plain HTTP, with no DNS and no
certificate.

The node addresses are read from our own pods' `status.hostIP`. `kubectl get
nodes` is not an option: Node is cluster-scoped and this service account has
no rights there.

To retire it once the Ingress works:

```bash
# set exposeNodePort to "false" in azure-pipelines.yml, then:
kubectl -n dev delete svc ksgaal-activity-map-nodeport
```

## Database

The academy confirmed on 2026-09-21 that the development database is created
inside the cluster rather than provisioned as a separate resource, so
`overlays/dev/postgres.yaml` runs PostgreSQL in `dev`: one replica, a 5Gi
`ReadWriteOnce` claim, and a ClusterIP Service named `ksgaal-postgres`.

The image cannot come from Docker Hub — the nodes have no outbound internet.
The build agent does, so the pipeline pulls `postgres:16-alpine` there and
pushes it back into the academy's own registry as a tag of the one repository
they allocated. The cluster then pulls it like any other image.

Credentials are generated once, on the first deploy, into the Secret
`ksgaal-postgres-credentials`, and never rewritten. Regenerating them on every
run would leave the password on disk out of step with the one the app is
given, and authentication would start failing on the second deploy with
nothing in the logs to explain it. The pipeline reads that Secret back to
compose `DATABASE_URL`, so the app Secret and the migration Job can never
disagree about what to connect to.

The claim deliberately names no StorageClass — those are cluster-scoped and
unreadable from here, so naming one would be a guess. If it stays `Pending`,
the cluster has no default and the academy needs to tell us which to use.

Set `deployInClusterPostgres` to `false` in the pipeline to point the app at
an external database through the `DATABASE_URL` variable instead. With
neither, the app still deploys: migrations are skipped and it runs degraded.

### Bootstrap

The migration Job runs `prisma migrate deploy` and then
`node prisma-dist/bootstrap.cjs`, which upserts the built-in roles and — when
`ADMIN_EMAIL` and `ADMIN_PASSWORD` are set — the admin account. Migrations
alone leave a correct schema that nobody can sign in to.

It is **not** `npm run db:deploy`. That script ends in `prisma db seed`, which
deletes every activity, type, organization and country before importing, and
must never run against a deployed database.

## Configuration — there is no `.env` here

Nothing in this deployment reads a `.env` file. Configuration splits in two,
by whether it varies between environments:

| Where | What | Who edits it |
|---|---|---|
| `base/configmap.yaml` | Static: `NODE_ENV`, `PORT`, `SESSION_TTL_DAYS`, `SMTP_PORT`, `SMTP_SECURE` | committed to this repo |
| `aatw-dev` variable group | Everything environment-specific, secret or not | Pipelines > Library |

The pipeline turns the whole variable group into one Secret,
`ksgaal-activity-map-secrets`, which both pod specs read with `envFrom`.

Non-secret values such as `APP_URL` and the `NEXT_PUBLIC_*` URLs live in that
Secret rather than in the ConfigMap. That is deliberate. They used to sit in
both places, and a value updated in one and forgotten in the other is exactly
how the browser ends up calling a hostname the server has never heard of. One
place to set an environment is worth more than a tidier split.

### The only one that really matters

| Key | Notes |
|---|---|
| `JWT_SECRET` | ≥32 random characters — mark secret. Sessions depend on it. |

### Everything else degrades rather than failing

| Key | What happens if it is empty |
|---|---|
| `DATABASE_URL` | Ignored while `deployInClusterPostgres` is on. With it off and this empty, the app runs degraded: empty globe, migrations skipped. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | No admin account is created and nobody can sign in to the dashboard. Mark the password secret. |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Email features are unavailable. Mark the credentials secret. |
| `APP_URL` | Only used for links inside emails, which are read outside the cluster and need an absolute address. |
| `NEXT_PUBLIC_FRONTEND_URL` | SEO canonical tags are omitted. Leave it empty until there is a real public hostname. |
| `NEXT_PUBLIC_BACKEND_URL` | Empty means same-origin, which is what you want. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map features that need a key are unavailable. |

Leaving both `NEXT_PUBLIC_*` URLs empty is the supported setup, not a
shortcut. The browser calls the origin that served the page and server
components call loopback, so one image works behind the temporary node port,
a real ingress, or localhost — with no rebuild when the hostname arrives.

`secret.example.yaml` is **only a documentation template** — do not commit a
real Secret manifest.

## Replacing the image placeholder

`base/deployment.yaml` and `base/migration-job.yaml` both reference:

```
IMAGE_REF
```

The Azure DevOps pipeline resolves it with `sed` before applying:

```bash
IMAGE="jed.ocir.io/axzbw7rafu2r/aatw/dev:${BUILD_BUILDID}"
sed -i "s#IMAGE_REF#${IMAGE}#g" \
  k8s/base/deployment.yaml k8s/base/migration-job.yaml
```

## Deploy order

The pipeline (and any manual deploy) must follow this sequence. Deploying
before migrations can cause runtime errors; skipping the migration wait can
cause a half-migrated database to serve production traffic.

```bash
NS=dev
IMG="jed.ocir.io/axzbw7rafu2r/aatw/dev:1234"

# 1. ConfigMap + Service + Ingress. The overlay deliberately contains no
#    Namespace resource — the service account cannot create one, and `dev`
#    already exists.
kubectl apply -k "k8s/overlays/dev/"

# 2. Create / update the Kubernetes Secret from env vars (never from a file)
kubectl -n "$NS" create secret generic ksgaal-activity-map-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  ... \
  --dry-run=client -o yaml | kubectl apply -f -

# 4. Delete any previous migration Job so re-runs are clean.
kubectl -n "$NS" delete job ksgaal-activity-map-migrate --ignore-not-found=true

# 5. Apply the migration Job (image already substituted by sed).
kubectl -n "$NS" apply -f k8s/base/migration-job.yaml

# 6. Wait for migration to complete. Pipeline halts here on failure.
kubectl -n "$NS" wait \
  --for=condition=complete \
  --timeout=300s \
  job/ksgaal-activity-map-migrate

# 7. Apply the Deployment (image already substituted by sed).
kubectl -n "$NS" apply -f k8s/base/deployment.yaml

# 8. Wait for rollout.
kubectl -n "$NS" rollout status deployment/ksgaal-activity-map --timeout=300s
```

## Validate manifests locally

```bash
# Requires kubectl with kustomize support (kubectl v1.21+).
kubectl kustomize k8s/overlays/dev
```

## Smoke tests

After deploy, verify through the Ingress:

```bash
curl -fsSL https://dev.example.com/api/health/live
curl -fsSL https://dev.example.com/api/health/ready
```

Both should return HTTP 200 with `"status": "ok"`. `/api/health/ready`
returns 503 if the database is unreachable.

## Notes

- `/api/admin/health` exists in the codebase but **requires a session cookie**
  and must not be used as a K8s probe. Probes use `/api/health/live` and
  `/api/health/ready`, which are unauthenticated.
- TLS: `overlays/dev/ingress-patch.yaml` references the TLS secret
  `ksgaal-dev-tls`. Both it and the host `dev.example.com` are placeholders
  awaiting the academy's real development hostname and certificate.
- `replicas: 2` is the baseline in `base/deployment.yaml`. An HPA is not an
  option here: the service account cannot even list
  `horizontalpodautoscalers`, so scaling stays manual.
- The pipeline loads configuration and secrets from the single `aatw-dev`
  variable group. Registry credentials are **not** among them — those live in
  the `Docker_AATW` service connection.
