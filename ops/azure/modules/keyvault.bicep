// Azure Key Vault

@description('Location for the Key Vault')
param location string

@description('Environment name')
@allowed(['staging', 'production'])
param environmentName string

@description('Principal ID of the Container Apps managed identity for secrets access')
param containerAppsPrincipalId string = ''

param tags object = {}

var vaultName = 'kv-lendq-${environmentName}'

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled' // Locked down via private endpoint in hardening phase
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Grant Key Vault Secrets User role to the Container Apps managed identity
resource secretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(containerAppsPrincipalId)) {
  name: guid(keyVault.id, containerAppsPrincipalId, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    principalId: containerAppsPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalType: 'ServicePrincipal'
  }
}

@description('The resource ID of the Key Vault')
output id string = keyVault.id

@description('The name of the Key Vault')
output name string = keyVault.name

@description('The URI of the Key Vault')
output uri string = keyVault.properties.vaultUri
