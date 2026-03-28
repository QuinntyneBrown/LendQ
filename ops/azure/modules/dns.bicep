// Azure DNS Zone (shared across environments)

@description('The DNS zone name (e.g., lendq.com)')
param zoneName string

param tags object = {}

resource dnsZone 'Microsoft.Network/dnsZones@2023-07-01-preview' = {
  name: zoneName
  location: 'global'
  tags: tags
  properties: {
    zoneType: 'Public'
  }
}

@description('The resource ID of the DNS zone')
output id string = dnsZone.id

@description('The name servers for the DNS zone')
output nameServers array = dnsZone.properties.nameServers
