/**
 * V4 Sourcing Intelligence — Data Layer Foundation v1
 * Storage abstraction ready for database integration.
 */

const collections = {
  products: [],
  suppliers: [],
  opportunities: [],
  analyses: [],
  decisions: [],
  history: [],
};

export function createRecord(collection, data = {}) {
  if (!collections[collection]) {
    throw new Error(`Unknown collection: ${collection}`);
  }

  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    ...data,
  };

  collections[collection].push(record);
  return record;
}

export function getRecords(collection) {
  return collections[collection] || [];
}

export function findRecord(collection, id) {
  return getRecords(collection).find((item) => item.id === id) || null;
}

export function getDatabaseSnapshot() {
  return JSON.parse(JSON.stringify(collections));
}
