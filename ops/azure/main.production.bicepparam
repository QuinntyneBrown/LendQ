using './main.bicep'

param environmentName = 'production'

// Database — General Purpose D2ds_v4, 128 GB, geo-redundant backups
param dbSkuName = 'Standard_D2ds_v4'
param dbSkuTier = 'GeneralPurpose'
param dbStorageSizeGb = 128
param dbBackupRetentionDays = 35
param dbGeoRedundantBackup = true
param dbAdminPassword = readEnvironmentVariable('DB_ADMIN_PASSWORD')

// Redis — Standard C1 (1 GB)
param redisSku = 'Standard'
param redisCapacity = 1

// Container Apps — production scaling
param apiMinReplicas = 2
param apiMaxReplicas = 5
param workerMinReplicas = 2
param workerMaxReplicas = 10
param beatReplicas = 1

// Application
param customDomain = 'app.lendq.com'
param logLevel = 'INFO'
param swaSku = 'Standard'

// Secrets (read from environment variables at deploy time)
param secretKey = readEnvironmentVariable('SECRET_KEY')
param jwtSecretKey = readEnvironmentVariable('JWT_SECRET_KEY')

// Shared
param acrName = 'lendqacr'
