// Azure Static Web Apps for the React SPA

@description('Location for the Static Web App')
param location string

@description('Environment name')
@allowed(['staging', 'production'])
param environmentName string

@description('SKU for the Static Web App')
@allowed(['Free', 'Standard'])
param sku string = 'Free'

@description('The URL of the backend API for proxying /api/* requests')
param apiBackendUrl string = ''

param tags object = {}

var appName = 'swa-lendq-${environmentName}'

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: appName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

// Link the backend API if provided
resource linkedBackend 'Microsoft.Web/staticSites/linkedBackends@2023-12-01' = if (!empty(apiBackendUrl)) {
  parent: staticWebApp
  name: 'api-backend'
  properties: {
    backendResourceId: apiBackendUrl
    region: location
  }
}

@description('The default hostname of the Static Web App')
output defaultHostname string = staticWebApp.properties.defaultHostname

@description('The resource ID of the Static Web App')
output id string = staticWebApp.id

@description('The name of the Static Web App')
output name string = staticWebApp.name

@description('The deployment token for the Static Web App')
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
