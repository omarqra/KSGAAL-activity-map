# Kubernetes manifests — `ksgaal-activity-map`

Manifests for deploying the Next.js app to the academy's internal Kubernetes
cluster, reached through the `development-AATW` service connection.

The pipeline's service account (`azdevops-dev`) has full rights **inside the
`dev` namespace only** and none at cluster scope — so nothing here creates a
Namespace, and `dev` is assumed to already exist.

PostgreSQL is treated as **external / managed** (e.g. Azure Database for
PostgreSQL Flexible Server). There are no in-cluster database resources here.

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
│       ├── configmap-patch.yaml # Dev URLs, APP_ENV=dev
│       └── ingress-patch.yaml   # dev.example.com, TLS secret ksgaal-dev-tls
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

Images live in Oracle Cloud's registry in Jeddah:
`jed.ocir.io/axzbw7rafu2r/ksgaal-activity-map`. The `REGISTRY_HOST` and
`IMAGE_TAG` placeholders in `deployment.yaml` and `migration-job.yaml` are
substituted by the pipeline at deploy time.

Those repositories are private, so both pod specs reference an
`ocir-pull-secret`. The pipeline creates it in `dev` from the OCIR
credentials in the `aatw-dev` variable group — it does not need to exist
beforehand.

## Required Secret

`deployment.yaml` and `migration-job.yaml` pull `envFrom` a Secret named
`ksgaal-activity-map-secrets` in the target namespace. It must contain:

| Key               | Description                                  |
|-------------------|----------------------------------------------|
| `DATABASE_URL`    | `postgresql://user:pass@host:5432/db`        |
| `JWT_SECRET`      | ≥32-char random string                       |
| `SMTP_USER`       | SMTP auth username                           |
| `SMTP_PASS`       | SMTP auth password / app password            |
| `ADMIN_EMAIL`     | Seed admin email (first deploy only)         |
| `ADMIN_PASSWORD`  | Seed admin password (first deploy only)      |
| `ADMIN_NAME`      | Seed admin display name (first deploy only)  |

### Creating the Secret (safe — never put real values in a YAML file)

```bash
NS=ksgaal-staging   # or ksgaal-production

kubectl -n "$NS" create secret generic ksgaal-activity-map-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=SMTP_USER="$SMTP_USER" \
  --from-literal=SMTP_PASS="$SMTP_PASS" \
  --from-literal=ADMIN_EMAIL="$ADMIN_EMAIL" \
  --from-literal=ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  --from-literal=ADMIN_NAME="$ADMIN_NAME" \
  --dry-run=client -o yaml | kubectl apply -f -
```

`secret.example.yaml` is **only a documentation template** — do not commit a
real Secret manifest.

## Replacing the image placeholder

`base/deployment.yaml` and `base/migration-job.yaml` both reference:

```
ACR_LOGIN_SERVER/ksgaal-activity-map:IMAGE_TAG
```

The Azure DevOps pipeline resolves these with `sed` before applying:

```bash
sed -i \
  "s#ACR_LOGIN_SERVER#${ACR_LOGIN_SERVER}#g; s#IMAGE_TAG#${BUILD_BUILDID}#g" \
  k8s/base/deployment.yaml k8s/base/migration-job.yaml
```

## Deploy order

The pipeline (and any manual deploy) must follow this sequence. Deploying
before migrations can cause runtime errors; skipping the migration wait can
cause a half-migrated database to serve production traffic.

```bash
OVERLAY=overlays/staging    # or overlays/production
NS=ksgaal-staging           # or ksgaal-production
IMG="myacr.azurecr.io/ksgaal-activity-map:1234"

# 1. Namespace (idempotent — kustomize includes namespace.yaml)
kubectl apply -k "k8s/${OVERLAY}/"

# 2. Create / update the Kubernetes Secret from env vars (never from a file)
kubectl -n "$NS" create secret generic ksgaal-activity-map-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  ... \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. ConfigMap + Service + Ingress are applied by the kustomize step above.

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
kubectl kustomize k8s/overlays/staging
kubectl kustomize k8s/overlays/production
```

## Smoke tests

After deploy, verify through the Ingress:

```bash
curl -fsSL https://staging.example.com/api/health/live
curl -fsSL https://staging.example.com/api/health/ready
```

Both should return HTTP 200 with `"status": "ok"`. `/api/health/ready`
returns 503 if the database is unreachable.

## Notes

- `/api/admin/health` exists in the codebase but **requires a session cookie**
  and must not be used as a K8s probe. Probes use `/api/health/live` and
  `/api/health/ready`, which are unauthenticated.
- TLS: each overlay's `ingress-patch.yaml` references a TLS secret
  (`ksgaal-staging-tls` / `ksgaal-production-tls`). Provision via cert-manager
  or load manually before the first deploy.
- `replicas: 2` is the baseline in `base/deployment.yaml`; tune with HPA as
  load warrants.
- The Azure DevOps pipeline loads environment-specific secrets from variable
  groups: `ksgaal-staging-secrets` and `ksgaal-production-secrets`. Variable
  group names for shared non-secret config: `ksgaal-staging-shared` and
  `ksgaal-production-shared`. Common pipeline vars: `ksgaal-common`.
