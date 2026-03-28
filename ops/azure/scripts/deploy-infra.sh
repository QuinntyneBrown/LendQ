#!/usr/bin/env bash
# deploy-infra.sh — Deploy LendQ Azure infrastructure via Bicep
#
# Usage:
#   ./ops/azure/scripts/deploy-infra.sh <environment>
#
# Environment variables required:
#   DB_ADMIN_PASSWORD   — PostgreSQL administrator password
#   SECRET_KEY          — Flask session signing key
#   JWT_SECRET_KEY      — JWT token signing key
#
# Optional:
#   AZURE_LOCATION      — Azure region (default: eastus)
#   IMAGE_TAG           — Container image tag (default: latest)

set -euo pipefail

ENVIRONMENT="${1:?Usage: deploy-infra.sh <staging|production>}"

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "Error: environment must be 'staging' or 'production'"
  exit 1
fi

# Validate required environment variables
for var in DB_ADMIN_PASSWORD SECRET_KEY JWT_SECRET_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo "Error: $var environment variable is required"
    exit 1
  fi
done

LOCATION="${AZURE_LOCATION:-eastus}"
RESOURCE_GROUP="rg-lendq-${ENVIRONMENT}"
TEMPLATE_FILE="ops/azure/main.bicep"
PARAMS_FILE="ops/azure/main.${ENVIRONMENT}.bicepparam"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DEPLOYMENT_NAME="lendq-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"

echo "═══════════════════════════════════════════════════════════"
echo "  LendQ Infrastructure Deployment"
echo "  Environment:    ${ENVIRONMENT}"
echo "  Resource Group: ${RESOURCE_GROUP}"
echo "  Location:       ${LOCATION}"
echo "  Image Tag:      ${IMAGE_TAG}"
echo "  Deployment:     ${DEPLOYMENT_NAME}"
echo "═══════════════════════════════════════════════════════════"

# Ensure resource group exists
echo ""
echo "→ Ensuring resource group '${RESOURCE_GROUP}' exists..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --tags project=lendq environment="$ENVIRONMENT" managedBy=bicep \
  --output none

# Run the deployment
echo ""
echo "→ Starting Bicep deployment..."
az deployment group create \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$TEMPLATE_FILE" \
  --parameters "$PARAMS_FILE" \
  --parameters imageTag="$IMAGE_TAG" \
  --output table

echo ""
echo "→ Deployment complete. Fetching outputs..."
az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.outputs" \
  --output table

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Deployment finished successfully!"
echo "═══════════════════════════════════════════════════════════"
