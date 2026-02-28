#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-compose}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "error: missing required command '$1'" >&2
    exit 1
  }
}

case "$MODE" in
  compose)
    require_cmd docker
    require_cmd docker-compose || true

    if [[ ! -f .env ]]; then
      echo "warning: .env not found. Create one from .env.example for Supabase variables." >&2
    fi

    echo "Starting local stack with Docker Compose..."
    docker compose up --build -d
    echo "Deployment complete. PWA: http://localhost:8080"
    ;;

  k8s)
    require_cmd kubectl

    if [[ -z "${RDI_IMAGE_PREFIX:-}" ]]; then
      echo "error: set RDI_IMAGE_PREFIX (e.g. ghcr.io/your-org/refugee) before k8s deploy" >&2
      exit 1
    fi

    echo "Applying Kubernetes namespace/resources..."
    kubectl apply -f k8s/platform.yaml

    echo "Updating images..."
    kubectl -n refugee-digital-identity set image deployment/identity-service app="${RDI_IMAGE_PREFIX}/identity-service:latest"
    kubectl -n refugee-digital-identity set image deployment/ngo-service app="${RDI_IMAGE_PREFIX}/ngo-service:latest"
    kubectl -n refugee-digital-identity set image deployment/service-catalog-service app="${RDI_IMAGE_PREFIX}/service-catalog-service:latest"
    kubectl -n refugee-digital-identity set image deployment/ai-service app="${RDI_IMAGE_PREFIX}/ai-service:latest"

    echo "Waiting for rollout..."
    kubectl -n refugee-digital-identity rollout status deployment/identity-service
    kubectl -n refugee-digital-identity rollout status deployment/ngo-service
    kubectl -n refugee-digital-identity rollout status deployment/service-catalog-service
    kubectl -n refugee-digital-identity rollout status deployment/ai-service
    ;;

  *)
    echo "usage: $0 [compose|k8s]" >&2
    exit 1
    ;;
esac
