// V4 Data Schema Engine v1
// Official data structures for V4 Sourcing Intelligence

const schemas = {
  product: {
    id: null,
    name: null,
    category: null,
    source: null,
    scores: {},
    status: null
  },
  supplier: {
    id: null,
    name: null,
    source: null,
    moq: null,
    reliabilityScore: 0
  },
  score: {
    winner: 0,
    market: 0,
    supplier: 0,
    reliability: 0,
    profit: 0,
    risk: 0,
    total: 0
  },
  decision: {
    action: null,
    reason: null,
    timestamp: null
  },
  history: {
    entity: null,
    event: null,
    result: null,
    timestamp: null
  }
};

function getSchema(type) {
  return schemas[type] || null;
}

function validateSchema(type, data) {
  const schema = getSchema(type);
  if (!schema) return false;
  return typeof data === 'object' && data !== null;
}

module.exports = {
  getSchema,
  validateSchema
};
