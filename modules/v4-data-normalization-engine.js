// V4 Data Normalization Engine
// Standardise external source data before Radar analysis

const schemas = {
  product: {
    name: '',
    category: '',
    source: '',
    price: 0,
    demandSignal: 0,
    confidence: 0
  },
  supplier: {
    name: '',
    source: '',
    moq: 0,
    cost: 0,
    confidence: 0
  }
};

function normalizeProduct(data = {}) {
  return {
    name: data.name || 'Unknown product',
    category: data.category || 'unknown',
    source: data.source || 'manual',
    price: Number(data.price || 0),
    demandSignal: Number(data.demandSignal || 0),
    confidence: Number(data.confidence || 0)
  };
}

function normalizeSupplier(data = {}) {
  return {
    name: data.name || 'Unknown supplier',
    source: data.source || 'manual',
    moq: Number(data.moq || 0),
    cost: Number(data.cost || 0),
    confidence: Number(data.confidence || 0)
  };
}

function getSchema(type) {
  return schemas[type] || null;
}

module.exports = {
  normalizeProduct,
  normalizeSupplier,
  getSchema
};
