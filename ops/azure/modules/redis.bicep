// Azure Cache for Redis

@description('Location for the Redis cache')
param location string

@description('Environment name')
@allowed(['staging', 'production'])
param environmentName string

@description('Redis SKU name')
@allowed(['Basic', 'Standard', 'Premium'])
param skuName string = 'Basic'

@description('Redis cache capacity (C0=250MB, C1=1GB, C2=2.5GB)')
@minValue(0)
@maxValue(6)
param capacity int = 0

param tags object = {}

var cacheName = 'redis-lendq-${environmentName}'
var skuFamily = skuName == 'Premium' ? 'P' : 'C'

resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: cacheName
  location: location
  tags: tags
  properties: {
    sku: {
      name: skuName
      family: skuFamily
      capacity: capacity
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled' // Locked down via private endpoint in hardening phase
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
  }
}

@description('The hostname of the Redis cache')
output hostname string = redisCache.properties.hostName

@description('The SSL port of the Redis cache')
output sslPort int = redisCache.properties.sslPort

@description('The resource ID of the Redis cache')
output id string = redisCache.id

@description('The name of the Redis cache')
output name string = redisCache.name

@description('The primary access key for the Redis cache')
output primaryKey string = redisCache.listKeys().primaryKey

@description('The Redis connection URL for the application')
output connectionString string = 'rediss://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:${redisCache.properties.sslPort}/0'
