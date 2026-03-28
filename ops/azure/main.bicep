// LendQ Infrastructure — Main Orchestrator
// Deploys all resources for a given environment (staging or production)
//
// Usage:
//   az deployment group create \
//     --resource-group rg-lendq-<env> \
//     --template-file ops/azure/main.bicep \
//     --parameters ops/azure/main.<env>.bicepparam

targetScope = 'resourceGroup'

// ─── Core parameters ───────────────────────────────────────────────

@description('Environment name')
@allowed(['staging', 'production'])
param environmentName string

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Container image tag (git SHA)')
param imageTag string = 'latest'

// ─── Database parameters ───────────────────────────────────────────

@description('PostgreSQL SKU name')
param dbSkuName string = 'Standard_B1ms'

@description('PostgreSQL SKU tier')
@allowed(['Burstable', 'GeneralPurpose', 'MemoryOptimized'])
param dbSkuTier string = 'Burstable'

@description('PostgreSQL storage size in GB')
param dbStorageSizeGb int = 32

@description('Database backup retention days')
param dbBackupRetentionDays int = 7

@description('Enable geo-redundant database backup')
param dbGeoRedundantBackup bool = false

@secure()
@description('PostgreSQL administrator password')
param dbAdminPassword string

// ─── Redis parameters ──────────────────────────────────────────────

@description('Redis SKU name')
@allowed(['Basic', 'Standard', 'Premium'])
param redisSku string = 'Basic'

@description('Redis cache capacity (C0=250MB, C1=1GB)')
param redisCapacity int = 0

// ─── Container Apps parameters ─────────────────────────────────────

@description('API minimum replicas')
param apiMinReplicas int = 1

@description('API maximum replicas')
param apiMaxReplicas int = 2

@description('Worker minimum replicas')
param workerMinReplicas int = 1

@description('Worker maximum replicas')
param workerMaxReplicas int = 2

@description('Beat replicas (always 1)')
param beatReplicas int = 1

@description('Custom domain for the environment')
param customDomain string = ''

@description('Log level for the application')
@allowed(['DEBUG', 'INFO', 'WARNING', 'ERROR'])
param logLevel string = 'DEBUG'

// ─── Secrets ───────────────────────────────────────────────────────

@secure()
@description('Flask SECRET_KEY')
param secretKey string

@secure()
@description('JWT signing key')
param jwtSecretKey string

// ─── Static Web App parameters ─────────────────────────────────────

@description('Static Web App SKU')
@allowed(['Free', 'Standard'])
param swaSku string = 'Free'

// ─── Shared resources ──────────────────────────────────────────────

@description('Name of the Azure Container Registry (must be globally unique, alphanumeric)')
param acrName string = 'lendqacr'

// ─── Tags ──────────────────────────────────────────────────────────

var tags = {
  project: 'lendq'
  environment: environmentName
  managedBy: 'bicep'
}

// ═══════════════════════════════════════════════════════════════════
// Module deployments
// ═══════════════════════════════════════════════════════════════════

// 1. Monitoring (needed first — Log Analytics ID feeds into Container Apps)
module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-${environmentName}'
  params: {
    location: location
    environmentName: environmentName
    tags: tags
  }
}

// 2. Container Registry (shared, but deployed per RG for simplicity)
module acr 'modules/acr.bicep' = {
  name: 'acr-${environmentName}'
  params: {
    location: location
    registryName: acrName
    tags: tags
  }
}

// 3. Database
module database 'modules/database.bicep' = {
  name: 'database-${environmentName}'
  params: {
    location: location
    environmentName: environmentName
    skuName: dbSkuName
    skuTier: dbSkuTier
    storageSizeGb: dbStorageSizeGb
    adminPassword: dbAdminPassword
    backupRetentionDays: dbBackupRetentionDays
    geoRedundantBackup: dbGeoRedundantBackup
    tags: tags
  }
}

// 4. Redis
module redis 'modules/redis.bicep' = {
  name: 'redis-${environmentName}'
  params: {
    location: location
    environmentName: environmentName
    skuName: redisSku
    capacity: redisCapacity
    tags: tags
  }
}

// 5. Container Apps (depends on monitoring, ACR, database, redis)
module containerApps 'modules/container-apps.bicep' = {
  name: 'container-apps-${environmentName}'
  params: {
    location: location
    environmentName: environmentName
    logAnalyticsCustomerId: monitoring.outputs.workspaceCustomerId
    logAnalyticsSharedKey: monitoring.outputs.workspaceSharedKey
    acrLoginServer: acr.outputs.loginServer
    acrId: acr.outputs.id
    imageTag: imageTag
    apiMinReplicas: apiMinReplicas
    apiMaxReplicas: apiMaxReplicas
    workerMinReplicas: workerMinReplicas
    workerMaxReplicas: workerMaxReplicas
    beatReplicas: beatReplicas
    customDomain: customDomain
    logLevel: logLevel
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    secretKey: secretKey
    jwtSecretKey: jwtSecretKey
    databaseUrl: 'postgresql+psycopg2://lendqadmin:${dbAdminPassword}@${database.outputs.fqdn}:5432/lendq?sslmode=require'
    redisUrl: redis.outputs.connectionString
    tags: tags
  }
}

// 6. Key Vault (grant access to Container Apps identity)
module keyvault 'modules/keyvault.bicep' = {
  name: 'keyvault-${environmentName}'
  params: {
    location: location
    environmentName: environmentName
    containerAppsPrincipalId: containerApps.outputs.identityPrincipalId
    tags: tags
  }
}

// 7. Static Web App (SWA has limited region availability; use eastus2 as fallback)
var swaLocation = location == 'eastus' ? 'eastus2' : location
module staticWebApp 'modules/static-webapp.bicep' = {
  name: 'static-webapp-${environmentName}'
  params: {
    location: swaLocation
    environmentName: environmentName
    sku: swaSku
    tags: tags
  }
}

// ═══════════════════════════════════════════════════════════════════
// Outputs
// ═══════════════════════════════════════════════════════════════════

@description('API URL')
output apiUrl string = containerApps.outputs.apiUrl

@description('API FQDN')
output apiFqdn string = containerApps.outputs.apiFqdn

@description('Static Web App default hostname')
output swaHostname string = staticWebApp.outputs.defaultHostname

@description('Static Web App name')
output swaName string = staticWebApp.outputs.name

@description('Container registry login server')
output acrLoginServer string = acr.outputs.loginServer

@description('PostgreSQL server FQDN')
output dbFqdn string = database.outputs.fqdn

@description('Redis hostname')
output redisHostname string = redis.outputs.hostname

@description('Key Vault name')
output keyVaultName string = keyvault.outputs.name

@description('Key Vault URI')
output keyVaultUri string = keyvault.outputs.uri

@description('Application Insights connection string')
output appInsightsConnectionString string = monitoring.outputs.appInsightsConnectionString

@description('Log Analytics workspace ID')
output logAnalyticsWorkspaceId string = monitoring.outputs.workspaceId
