// V4 Database Layer Engine v1
// Foundation for persistent storage architecture

const database = {
  products: [],
  suppliers: [],
  users: [],
  decisions: [],
  tests: []
};

function insert(collection, data) {
  if (!database[collection]) throw new Error('Unknown collection');
  const record = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...data
  };
  database[collection].push(record);
  return record;
}

function find(collection, filters = {}) {
  if (!database[collection]) return [];
  return database[collection].filter(item =>
    Object.entries(filters).every(([key, value]) => item[key] === value)
  );
}

function getDatabaseStats() {
  return Object.fromEntries(
    Object.entries(database).map(([key, value]) => [key, value.length])
  );
}

module.exports = {
  insert,
  find,
  getDatabaseStats
};
