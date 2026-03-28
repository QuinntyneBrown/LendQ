// Azure Container Apps Environment with API, Worker, and Beat apps

@description('Location for Container Apps resources')
param location string

@description('Environment name')
@allowed(['staging', 'production'])
param environmentName string

@description('Log Analytics workspace customer ID')
param logAnalyticsCustomerId string

@secure()
@description('Log Analytics workspace shared key')
param logAnalyticsSharedKey string

@description('Container registry login server')
param acrLoginServer string

@description('Container registry resource ID (for AcrPull role assignment)')
param acrId string

@description('Container image tag (git SHA)')
param imageTag string = 'latest'

// Scaling parameters
@description('Minimum replicas for the API app')
param apiMinReplicas int = 1

@description('Maximum replicas for the API app')
param apiMaxReplicas int = 2

@description('Minimum replicas for the Celery worker')
param workerMinReplicas int = 1

@description('Maximum replicas for the Celery worker')
param workerMaxReplicas int = 2

@description('Number of replicas for Celery Beat (always 1)')
param beatReplicas int = 1

// Environment variables
@description('Custom domain for CORS')
param customDomain string = ''

@description('Log level')
@allowed(['DEBUG', 'INFO', 'WARNING', 'ERROR'])
param logLevel string = 'DEBUG'

@description('Application Insights connection string')
param appInsightsConnectionString string = ''

// Secrets (passed from Key Vault or parameters)
@secure()
@description('Flask SECRET_KEY')
param secretKey string

@secure()
@description('JWT signing key')
param jwtSecretKey string

@secure()
@description('PostgreSQL connection string')
param databaseUrl string

@secure()
@description('Redis connection string')
param redisUrl string

param tags object = {}

var envName = 'cae-lendq-${environmentName}'
var imageName = '${acrLoginServer}/lendq-api:${imageTag}'

// Container Apps Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: envName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsSharedKey
      }
    }
    zoneRedundant: false
  }
}

// User-assigned managed identity for ACR pull
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-lendq-${environmentName}'
  location: location
  tags: tags
}

// Grant AcrPull role to the managed identity
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acrId, identity.id, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  scope: resourceGroup()
  properties: {
    principalId: identity.properties.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalType: 'ServicePrincipal'
  }
}

// Shared secrets for all container apps
var appSecrets = [
  { name: 'secret-key', value: secretKey }
  { name: 'jwt-secret-key', value: jwtSecretKey }
  { name: 'database-url', value: databaseUrl }
  { name: 'redis-url', value: redisUrl }
]

// Shared environment variables
var corsOrigin = !empty(customDomain) ? 'https://${customDomain}' : '*'
var appEnvVars = [
  { name: 'FLASK_ENV', value: 'production' }
  { name: 'SECRET_KEY', secretRef: 'secret-key' }
  { name: 'JWT_SECRET_KEY', secretRef: 'jwt-secret-key' }
  { name: 'DATABASE_URL', secretRef: 'database-url' }
  { name: 'REDIS_URL', secretRef: 'redis-url' }
  { name: 'LOG_LEVEL', value: logLevel }
  { name: 'LOG_FORMAT', value: 'json' }
  { name: 'CORS_ORIGINS', value: corsOrigin }
  { name: 'RATELIMIT_DEFAULT', value: '200/hour' }
  { name: 'RATE_LIMIT_AUTH', value: '5/minute' }
  { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
]

// --- API Container App ---
resource apiApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'lendq-api-${environmentName}'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: true
        targetPort: 8000
        transport: 'http'
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: acrLoginServer
          identity: identity.id
        }
      ]
      secrets: appSecrets
    }
    template: {
      containers: [
        {
          name: 'lendq-api'
          image: imageName
          command: ['gunicorn', '--bind', '0.0.0.0:8000', '--workers', '4', '--timeout', '120', 'app:create_app()']
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: appEnvVars
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/v1/health/live'
                port: 8000
              }
              periodSeconds: 10
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/v1/health/ready'
                port: 8000
              }
              periodSeconds: 10
              failureThreshold: 3
              initialDelaySeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: apiMinReplicas
        maxReplicas: apiMaxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  dependsOn: [acrPullRole]
}

// --- Celery Worker Container App ---
resource workerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'lendq-worker-${environmentName}'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      registries: [
        {
          server: acrLoginServer
          identity: identity.id
        }
      ]
      secrets: appSecrets
    }
    template: {
      containers: [
        {
          name: 'lendq-worker'
          image: imageName
          command: ['celery', '-A', 'app.celery_app:celery', 'worker', '--loglevel=info', '--concurrency=4']
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: appEnvVars
        }
      ]
      scale: {
        minReplicas: workerMinReplicas
        maxReplicas: workerMaxReplicas
      }
    }
  }
  dependsOn: [acrPullRole]
}

// --- Celery Beat Container App ---
resource beatApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'lendq-beat-${environmentName}'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      registries: [
        {
          server: acrLoginServer
          identity: identity.id
        }
      ]
      secrets: appSecrets
    }
    template: {
      containers: [
        {
          name: 'lendq-beat'
          image: imageName
          command: ['celery', '-A', 'app.celery_app:celery', 'beat', '--loglevel=info']
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: appEnvVars
        }
      ]
      scale: {
        minReplicas: beatReplicas
        maxReplicas: beatReplicas
      }
    }
  }
  dependsOn: [acrPullRole]
}

// --- Migration Job ---
resource migrationJob 'Microsoft.App/jobs@2024-03-01' = {
  name: 'lendq-migrate-${environmentName}'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    environmentId: containerAppEnv.id
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 600
      replicaRetryLimit: 1
      registries: [
        {
          server: acrLoginServer
          identity: identity.id
        }
      ]
      secrets: appSecrets
    }
    template: {
      containers: [
        {
          name: 'lendq-migrate'
          image: imageName
          command: ['flask', '--app', 'app:create_app', 'db', 'upgrade']
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: appEnvVars
        }
      ]
    }
  }
  dependsOn: [acrPullRole]
}

@description('The FQDN of the API container app')
output apiFqdn string = apiApp.properties.configuration.ingress.fqdn

@description('The URL of the API container app')
output apiUrl string = 'https://${apiApp.properties.configuration.ingress.fqdn}'

@description('The Container Apps Environment ID')
output environmentId string = containerAppEnv.id

@description('The managed identity principal ID')
output identityPrincipalId string = identity.properties.principalId

@description('The API app resource ID (for SWA linked backend)')
output apiAppId string = apiApp.id
