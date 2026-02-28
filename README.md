# Refugee Digital Identity

Cloud-native, secure, modular, AI-powered humanitarian platform focused on refugees in **Dadaab (Hagadera, Ifo, Dagahaley)** and **Kakuma**, Kenya.

## Platform capabilities

- Mobile-first PWA app: **Refugee Digital Identity** with UNICEF visual theme (`#1CABE2`).
- Microservices built with **Node.js + Express**: Identity, NGO Operations, Service Catalog, AI Assistant.
- Identity service uses **Supabase** for authentication credential provisioning and profile storage (login endpoint intentionally deferred).
- Security controls: MFA flow, device binding fields, encrypted-by-design architecture guidance.
- Offline-first support: service worker caching, local fallback recommendations.
- Analytics-ready modules for NGO reporting and predictive demand planning.

## Architecture

- **Cloud-native microservices** exposed as REST APIs.
- **Containerized** with Docker (`docker-compose.yml`).
- **Kubernetes deployment** baseline and autoscaling (`k8s/platform.yaml`).
- **Data services** placeholders for PostgreSQL + Redis.
- CI pipeline with GitHub Actions (`.github/workflows/ci.yml`).

## Services

| Service | Port | Key endpoints |
|---|---:|---|
| identity-service | 8001 | `/v1/register`, `/v1/authenticate`, `/v1/id-card/{id}` |
| ngo-service | 8002 | `/v1/announcements`, `/v1/service-delivery`, `/v1/reports/utilization` |
| service-catalog-service | 8003 | `/v1/services` |
| ai-service | 8004 | `/v1/recommendations`, `/v1/analytics/demand-forecast` |
| pwa | 8080 | `/index.html` |

## Run locally

```bash
docker compose up --build
```


## Identity service (Supabase)

Set these environment variables for `identity-service`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Apply baseline table schema from `docs/supabase-identity-schema.sql` (includes `registration_channel`, unique `phone_number`, and unique `ration_card`).

> Note: Login/authenticate endpoint is intentionally not implemented yet and returns `501` until requested.

Supabase readiness check endpoint:

- `GET /v1/supabase/status`

## Run tests locally

```bash
npm install --prefix services/identity-service
npm test
```

## Security and compliance baseline

This implementation includes a reference baseline and extension points for:

- AES-256 at rest (via cloud-managed encrypted volumes/object storage configuration).
- TLS 1.3 in transit (to be enforced at ingress/API gateway level).
- Consent-based data handling and data minimization workflows.
- RBAC-ready NGO service model.
- Immutable audit trail support via append-only logs and SIEM integrations.

## Future expansion

- UNHCR/DRS integrations via API adapters.
- Digital cash vouchers and biometric hardware connectors.
- Blockchain identity hash notarization and cross-border portability.
- AI case-management model refinement using camp-level feedback loops.

## NGO content operations

- Master prompt for verified multilingual NGO announcements: `docs/ngo-announcement-publishing-prompt.md`
