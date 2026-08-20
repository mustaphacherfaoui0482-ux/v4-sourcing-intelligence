/**
 * V4 Sourcing Intelligence — Connectors Registry v2
 * Catalog only: a source is not considered live until its connector is configured and checked.
 */

export const connectors = [
  { name: 'Google Trends', category: 'trend', status: 'manual' },
  { name: 'Google Ads', category: 'search', status: 'manual' },
  { name: 'TikTok Creative Center', category: 'ads', status: 'manual' },
  { name: 'Meta Ad Library', category: 'ads', status: 'manual' },
  { name: 'Minea', category: 'ads', status: 'manual' },
  { name: 'PiPiADS', category: 'ads', status: 'manual' },
  { name: 'BigSpy', category: 'ads', status: 'manual' },
  { name: 'AdSpy', category: 'ads', status: 'manual' },
  { name: 'Dropship.io', category: 'product', status: 'manual' },
  { name: 'Sell The Trend', category: 'product', status: 'manual' },
  { name: 'ShopHunter', category: 'store', status: 'manual' },
  { name: 'Koala Inspector', category: 'store', status: 'manual' },
  { name: 'Amazon Best Sellers', category: 'marketplace', status: 'manual' },
  { name: 'AliExpress', category: 'sourcing', status: 'manual' },
  { name: 'Alibaba', category: 'sourcing', status: 'manual' },
  { name: '1688', category: 'sourcing', status: 'manual' },
  { name: 'Similarweb', category: 'market', status: 'manual' },
  { name: 'Semrush', category: 'market', status: 'manual' },
  { name: 'Ahrefs', category: 'market', status: 'manual' }
];

export function getConnectorStatus(name) {
  return connectors.find((item) => item.name === name) || null;
}

export function listConnectors() {
  return connectors;
}
