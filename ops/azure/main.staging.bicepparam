using './main.bicep'

param environmentName = 'staging'

// Database — Burstable B1ms, 32 GB
param dbSkuName = 'Standard_B1ms'
param dbSkuTier = 'Burstable'
param dbStorageSizeGb = 32
param dbBackupRetentionDays = 7
param dbGeoRedundantBackup = false
param dbAdminPassword = readEnvironmentVariable('DB_ADMIN_PASSWORD')

// Redis — Basic C0 (250 MB)
param redisSku = 'Basic'
param redisCapacity = 0

// Container Apps — minimal scaling for staging
param apiMinReplicas = 1
param apiMaxReplicas = 2
param workerMinReplicas = 1
param workerMaxReplicas = 2
param beatReplicas = 1

// Application
param customDomain = 'staging.lendq.com'
param logLevel = 'DEBUG'
param swaSku = 'Free'

// Secrets (read from environment variables at deploy time)
param secretKey = readEnvironmentVariable('SECRET_KEY')
param jwtSecretKey = readEnvironmentVariable('JWT_SECRET_KEY')

// Shared
param acrName = 'lendqacr'
