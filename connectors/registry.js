/**
 * V4 Sourcing Intelligence — Connectors Registry v1
 * Central catalog of data sources.
 * No live API connections in V1.
 */

export const connectors = [
  { name: 'Google Trends', category: 'trend', status: 'manual' },
  { name: 'Google Ads', category: 'search', status: 'manual' },
  { name: 'TikTok Creative Center', category: 'ads', status: 'manual' },
  { name: 'Meta Ad Library', category: 'ads', status: 'manual' },
  { name: 'Minea', category: 'ads', status: 'manual' },
  { name: 'PiPiADS', category: 'ads', status: 'manual' },
  { name: 'BigSpy', category: 'ads', status: 'manual' },
  { name: 'Similarweb', category: 'market', status: 'manual' },
  { name: 'Amazon Best Sellers', category: 'marketplace', status: 'manual' },
  { name: 'AliExpress', category: 'sourcing', status: 'manual' },
  { name: 'Alibaba', category: 'sourcing', status: 'manual' },
  { name: '1688', category: 'sourcing', status: 'manual' }
];

export function getConnectorStatus(name) {
  return connectors.find((item) => item.name === name) || null;
}

export function listConnectors() {
  return connectors;
}
