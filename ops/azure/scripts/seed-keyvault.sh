#!/usr/bin/env bash
# seed-keyvault.sh — One-time: push initial secrets to Azure Key Vault
#
# Usage:
#   ./ops/azure/scripts/seed-keyvault.sh <environment>
#
# Environment variables required:
#   SECRET_KEY          — Flask session signing key
#   JWT_SECRET_KEY      — JWT token signing key
#   DB_ADMIN_PASSWORD   — PostgreSQL administrator password
#
# Optional:
#   MAIL_API_KEY        — Azure Communication Services email key

set -euo pipefail

ENVIRONMENT="${1:?Usage: seed-keyvault.sh <staging|production>}"

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "Error: environment must be 'staging' or 'production'"
  exit 1
fi

VAULT_NAME="kv-lendq-${ENVIRONMENT}"

echo "═══════════════════════════════════════════════════════════"
echo "  Seeding Key Vault: ${VAULT_NAME}"
echo "═══════════════════════════════════════════════════════════"

# Helper to set a secret if the env var is present
set_secret() {
  local secret_name="$1"
  local env_var="$2"
  local value="${!env_var:-}"

  if [[ -z "$value" ]]; then
    echo "  ⚠ Skipping ${secret_name} (${env_var} not set)"
    return
  fi

  echo "  → Setting ${secret_name}..."
  az keyvault secret set \
    --vault-name "$VAULT_NAME" \
    --name "$secret_name" \
    --value "$value" \
    --output none
}

set_secret "SECRET-KEY" "SECRET_KEY"
set_secret "JWT-SECRET-KEY" "JWT_SECRET_KEY"
set_secret "DATABASE-URL" "DATABASE_URL"
set_secret "REDIS-URL" "REDIS_URL"
set_secret "MAIL-API-KEY" "MAIL_API_KEY"

echo ""
echo "→ Listing secrets in ${VAULT_NAME}:"
az keyvault secret list \
  --vault-name "$VAULT_NAME" \
  --query "[].{Name:name, Enabled:attributes.enabled}" \
  --output table

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Key Vault seeding complete!"
echo "═══════════════════════════════════════════════════════════"
