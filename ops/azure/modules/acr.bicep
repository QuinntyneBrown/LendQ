// Azure Container Registry (shared across environments)

@description('Location for the container registry')
param location string

@description('Base name for the registry (must be globally unique, alphanumeric)')
param registryName string

@description('SKU for the container registry')
@allowed(['Basic', 'Standard', 'Premium'])
param sku string = 'Basic'

param tags object = {}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    policies: {
      retentionPolicy: {
        status: 'disabled'
      }
    }
  }
}

@description('The login server URL for the container registry')
output loginServer string = acr.properties.loginServer

@description('The resource ID of the container registry')
output id string = acr.id

@description('The name of the container registry')
output name string = acr.name
