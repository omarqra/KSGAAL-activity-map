# Kubernetes manifests — `ksgaal-activity-map`

Manifests for deploying the Next.js app to the academy's internal Kubernetes
cluster, reached through the `development-AATW` service connection.

The pipeline's service account (`azdevops-dev`) has full rights **inside the
`dev` namespace only** and none at cluster scope — so nothing here creates a
Namespace, and `dev` is assumed to already exist.

PostgreSQL is treated as **external / managed** and supplied by the academy.
There are no in-cluster database resources here.

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
NS=dev

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
