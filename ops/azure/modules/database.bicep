// Azure Database for PostgreSQL Flexible Server

@description('Location for the database server')
param location string

@description('Environment name')
@allowed(['staging', 'production'])
param environmentName string

@description('SKU name for the database server')
param skuName string = 'Standard_B1ms'

@description('SKU tier for the database server')
@allowed(['Burstable', 'GeneralPurpose', 'MemoryOptimized'])
param skuTier string = 'Burstable'

@description('Storage size in GB')
param storageSizeGb int = 32

@description('PostgreSQL version')
param version string = '15'

@description('Administrator login name')
param adminLogin string = 'lendqadmin'

@secure()
@description('Administrator password')
param adminPassword string

@description('Backup retention days')
param backupRetentionDays int = 7

@description('Enable geo-redundant backup')
param geoRedundantBackup bool = false

param tags object = {}

var serverName = 'psql-lendq-${environmentName}'

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: serverName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    version: version
    administratorLogin: adminLogin
    administratorLoginPassword: adminPassword
    storage: {
      storageSizeGB: storageSizeGb
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: geoRedundantBackup ? 'Enabled' : 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled' // Enable ZoneRedundant for production HA in hardening phase
    }
    network: {
      publicNetworkAccess: 'Enabled' // Locked down via private endpoint in hardening phase
    }
  }
}

// Require SSL connections
resource sslConfig 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-12-01-preview' = {
  parent: postgresServer
  name: 'require_secure_transport'
  properties: {
    value: 'on'
    source: 'user-override'
  }
}

// Create the application database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgresServer
  name: 'lendq'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure services (Container Apps) to connect
resource firewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

@description('The fully qualified domain name of the PostgreSQL server')
output fqdn string = postgresServer.properties.fullyQualifiedDomainName

@description('The resource ID of the PostgreSQL server')
output id string = postgresServer.id

@description('The server name')
output name string = postgresServer.name

@description('The connection string for the application database')
output connectionString string = 'postgresql+psycopg2://${adminLogin}:PASSWORD@${postgresServer.properties.fullyQualifiedDomainName}:5432/lendq?sslmode=require'
