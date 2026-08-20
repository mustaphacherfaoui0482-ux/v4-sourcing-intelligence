// V4 Knowledge Base Engine v1

const knowledgeBase = {
  products: [],
  suppliers: [],
  decisions: [],
  tests: []
};

function storeProduct(product) {
  knowledgeBase.products.push({ ...product, createdAt: new Date().toISOString() });
  return product;
}

function storeSupplier(supplier) {
  knowledgeBase.suppliers.push({ ...supplier, createdAt: new Date().toISOString() });
  return supplier;
}

function storeDecision(decision) {
  knowledgeBase.decisions.push({ ...decision, createdAt: new Date().toISOString() });
  return decision;
}

function storeTestResult(test) {
  knowledgeBase.tests.push({ ...test, createdAt: new Date().toISOString() });
  return test;
}

function searchKnowledge(type, query) {
  return (knowledgeBase[type] || []).filter(item =>
    JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
  );
}

function getKnowledgeStats() {
  return {
    products: knowledgeBase.products.length,
    suppliers: knowledgeBase.suppliers.length,
    decisions: knowledgeBase.decisions.length,
    tests: knowledgeBase.tests.length
  };
}

module.exports = {
  storeProduct,
  storeSupplier,
  storeDecision,
  storeTestResult,
  searchKnowledge,
  getKnowledgeStats
};
