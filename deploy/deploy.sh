#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Money Logger — first manual release to the course's shared Cloud Run resources
# ==============================================================================
# Usage (repo root, on an up-to-date `main`):
#   DRY_RUN=1 bash deploy/deploy.sh      # print the plan only (default)
#   DRY_RUN=0 bash deploy/deploy.sh      # build, push, migrate+seed, update service
#
# Environment Variables (Optional):
#   PROJECT_ID   GCP Project ID (defaults to active gcloud config project)
#   REGION       GCP Region (default: asia-southeast1)
#   DRY_RUN      Set DRY_RUN=1 to print all gcloud commands without executing
#
# WHAT THIS SCRIPT DOES
#   The course portal creates every resource (prefix s87ce2df5) in the shared
#   project cpe-se-course-2026. This script only builds the image, pushes it by
#   commit SHA, runs the migration+seed job and updates the service.
#   Later releases are done by GitHub Actions (deploy.yml -> deploy/release.sh).
#
# ⭐ IMPORTANT
#   - Never add steps that create, change IAM of, or delete shared resources.
#   - Secret values live only in Secret Manager; they are never printed.
#   - Preview first with:  DRY_RUN=1 ./deploy/deploy.sh   (no gcloud calls)
#   - Run from the REPO ROOT (step 9 builds the root Dockerfile).
#
# REFERENCES
#   - gcloud run deploy : https://cloud.google.com/sdk/gcloud/reference/run/deploy
#   - Cloud Run jobs    : https://cloud.google.com/run/docs/create-jobs
#   - Cloud SQL + Run   : https://cloud.google.com/sql/docs/postgres/connect-run
#   - Secret Manager    : https://cloud.google.com/secret-manager/docs
#   - Artifact Registry : https://cloud.google.com/artifact-registry/docs/docker
#
# ⭐ CHANGE ME — groups using another tech stack must review (marked below):
#   # CHANGE ME: resource names (REPO_NAME, SQL_INSTANCE, SERVICE_NAME, ...)
#   # CHANGE ME: database engine/version (steps 3, 4, 6)
#   # CHANGE ME: migrate/seed command of the Cloud Run job (step 10)
#   # CHANGE ME: port / memory / scaling flags (step 11)
# ==============================================================================

# ------------------------------------------------------------------------------
# Settings & argument parsing
# ------------------------------------------------------------------------------
DRY_RUN="${DRY_RUN:-1}"
# CHANGE ME: default region if your group uses another one.
REGION="${REGION:-asia-southeast1}"
[ "$#" -eq 0 ] || { echo "Usage: DRY_RUN=0|1 $0" >&2; exit 1; }

# Helper: prints the command (DRY_RUN=1) or prints then executes it.
# ⭐ IMPORTANT: --password=... is redacted in the log; keep this behaviour.
run_cmd() {
  # Log the command without exposing generated database credentials.
  local arg
  if [ "$DRY_RUN" = "1" ]; then
    printf '[DRY_RUN] '
  else
    printf '+ '
  fi
  for arg in "$@"; do
    case "$arg" in
      --password=*) printf '%s ' '--password=<REDACTED>' ;;
      *) printf '%q ' "$arg" ;;
    esac
  done
  printf '\n'
  if [ "$DRY_RUN" != "1" ]; then
    "$@"
  fi
}

# Resolve the GCP project: $PROJECT_ID, else the active gcloud project.
# Shared course project: no project discovery or project IAM changes.
PROJECT_ID="${PROJECT_ID:-cpe-se-course-2026}"
[[ "$PROJECT_ID" == "cpe-se-course-2026" ]] || { echo 'Wrong course project' >&2; exit 1; }
REGION="${REGION:-asia-southeast1}"
[[ "$REGION" == "asia-southeast1" ]] || { echo 'Wrong assigned region' >&2; exit 1; }
REPO_NAME="s87ce2df5"
SQL_INSTANCE="s87ce2df5-pg"
DB_NAME="s87ce2df5"
DB_USER="s87ce2df5"
SERVICE_NAME="s87ce2df5"
MIGRATE_JOB_NAME="s87ce2df5-migrate"
SA_NAME="s87ce2df5-runner"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SQL_CONN_NAME="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
if [ "$DRY_RUN" = "1" ]; then
  IMAGE_TAG="${IMAGE_TAG:-0000000000000000000000000000000000000000}"
else
  IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse HEAD)}"
  [[ "$(git branch --show-current)" == "main" ]] || { echo 'Deploy reviewed main only' >&2; exit 1; }
  [[ "$IMAGE_TAG" == "$(git rev-parse HEAD)" ]] || { echo 'IMAGE_TAG must match HEAD' >&2; exit 1; }
fi
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'Use full commit SHA' >&2; exit 1; }
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${IMAGE_TAG}"

# Secret Manager secret names (values are never stored in this repo).
# Money Logger: the seed always creates admin (ADMIN) + alice and bob (USER), so it needs both
# passwords; JWT_SECRET signs the session cookie and uses team slot app-secret-1.
SECRET_DB_URL="s87ce2df5-database-url"
SECRET_ADMIN_PASS="s87ce2df5-admin-password"
SECRET_USER_PASS="s87ce2df5-demo-password"
SECRET_JWT="s87ce2df5-app-secret-1"

echo "=================================================================="
echo "Money Logger Cloud Run release"
echo "Project : ${PROJECT_ID}"
echo "Region  : ${REGION}"
echo "Image   : ${IMAGE_URI}"
echo "Dry Run : ${DRY_RUN}"
echo "=================================================================="

# ==============================================================================
# Portal/TA pre-provisions infrastructure and public service IAM (Guide 5.3 steps 1–8, 5.4).
# These names must exist. Never create or modify project-level IAM here.
JOB_SECRETS="DATABASE_URL=${SECRET_DB_URL}:latest,SEED_ADMIN_PASSWORD=${SECRET_ADMIN_PASS}:latest,SEED_USER_PASSWORD=${SECRET_USER_PASS}:latest"
if [ "$DRY_RUN" != "1" ]; then
  gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" >/dev/null
  gcloud run jobs describe "$MIGRATE_JOB_NAME" --project "$PROJECT_ID" --region "$REGION" >/dev/null
fi
# 9. Build & Push Unified Container Image via Cloud Build
#    Builds the root Dockerfile (run this script from the repo root).
#    Tag `latest` is only for this first manual setup; deploy.yml uses commit SHAs.
# ==============================================================================
run_cmd gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
run_cmd docker build --platform linux/amd64 --build-arg APP_VERSION="$IMAGE_TAG" --tag "$IMAGE_URI" .
run_cmd docker push "$IMAGE_URI"
if [ "$DRY_RUN" != "1" ]; then
  IMAGE_URI="$(gcloud artifacts docker images describe "$IMAGE_URI" --project "$PROJECT_ID" --format='value(image_summary.fully_qualified_digest)')"
  [[ "$IMAGE_URI" == "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}@sha256:"* ]] || { echo 'Missing image digest' >&2; exit 1; }
fi

# ==============================================================================
# 10. Create/Update & Execute Cloud Run Job for Migration + Non-destructive Seed
#     ⭐ IMPORTANT: if this job fails the script stops BEFORE deploying the
#        service, so a broken migration never reaches users.
#     Money Logger: `prisma db seed` only creates missing users (safe on every release).
#     deploy.yml / release.sh later re-run this same job (name: s87ce2df5-migrate).
# ==============================================================================
run_cmd gcloud run jobs update "$MIGRATE_JOB_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --set-cloudsql-instances "$SQL_CONN_NAME" \
  --set-secrets "$JOB_SECRETS" \
  --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok" \
  --command "sh" \
  --args "-c,npx prisma migrate deploy && npx prisma db seed" \
  --max-retries 1 \
  --task-timeout 300s \
  --project "$PROJECT_ID"

if ! run_cmd gcloud run jobs execute "$MIGRATE_JOB_NAME" \
  --region "$REGION" \
  --wait \
  --project "$PROJECT_ID"; then
  printf '%s\n' "ERROR: Cloud Run migration job '${MIGRATE_JOB_NAME}' failed. Aborting service deployment." >&2
  printf '%s\n' "View job logs with:" >&2
  printf '%s\n' "  gcloud logging read \"resource.type=cloud_run_job AND resource.labels.job_name=${MIGRATE_JOB_NAME}\" --project \"${PROJECT_ID}\" --limit 50 --format=\"value(textPayload)\"" >&2
  exit 1
fi

# ==============================================================================
# 11. Deploy Cloud Run Service
#     Money Logger: port 4000; HTTPS so the cookie is Secure; the job migrates.
#     Public access is set up by the portal.
# ==============================================================================
run_cmd gcloud run services update "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --add-cloudsql-instances "$SQL_CONN_NAME" \
  --set-secrets "DATABASE_URL=${SECRET_DB_URL}:latest,JWT_SECRET=${SECRET_JWT}:latest" \
  --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok,COOKIE_SECURE=true,RUN_MIGRATIONS=false" \
  --min-instances 0 \
  --max-instances 1 \
  --memory 512Mi \
  --cpu 1 \
  --port 4000 \
  --project "$PROJECT_ID"

run_cmd gcloud run services update-traffic "$SERVICE_NAME" --to-latest --project "$PROJECT_ID" --region "$REGION" --quiet
if [ "$DRY_RUN" = "1" ]; then
  SERVICE_URL="https://${SERVICE_NAME}-<hash>-as.a.run.app"
else
  SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')"
fi

# ------------------------------------------------------------------------------
# Summary output (URLs; passwords stay in Secret Manager and are not printed)
# ------------------------------------------------------------------------------
printf '\n'
printf '%s\n' "=================================================================="
printf '%s\n' "Deployment Completed!"
printf '%s\n' "Service URL    : ${SERVICE_URL}"
printf '%s\n' "Health Check   : ${SERVICE_URL}/api/health"
printf '%s\n' "Readiness Check: ${SERVICE_URL}/api/ready"
printf '%s\n' "Demo users     : admin (ADMIN), alice and bob (USER)"
printf '%s\n' "Admin Password : Stored in Secret Manager: ${SECRET_ADMIN_PASS} (not printed)."
printf '%s\n' "User Password  : Stored in Secret Manager: ${SECRET_USER_PASS} (not printed)."
printf '%s\n' "=================================================================="
