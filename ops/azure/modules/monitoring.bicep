// Azure Monitor: Log Analytics workspace and Application Insights

@description('Location for monitoring resources')
param location string

@description('Environment name')
@allowed(['staging', 'production'])
param environmentName string

param tags object = {}

var workspaceName = 'log-lendq-${environmentName}'
var appInsightsName = 'appi-lendq-${environmentName}'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: 5
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// --- Alert rules ---

// API error rate alert (5xx > 5% over 5 min)
resource apiErrorAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-api-errors-${environmentName}'
  location: 'global'
  tags: tags
  properties: {
    severity: 1
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighServerErrorRate'
          metricName: 'requests/failed'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 5
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
  }
}

@description('The resource ID of the Log Analytics workspace')
output workspaceId string = logAnalytics.id

@description('The customer ID of the Log Analytics workspace')
output workspaceCustomerId string = logAnalytics.properties.customerId

@description('The shared key of the Log Analytics workspace')
output workspaceSharedKey string = logAnalytics.listKeys().primarySharedKey

@description('The resource ID of Application Insights')
output appInsightsId string = appInsights.id

@description('The instrumentation key of Application Insights')
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey

@description('The connection string of Application Insights')
output appInsightsConnectionString string = appInsights.properties.ConnectionString
