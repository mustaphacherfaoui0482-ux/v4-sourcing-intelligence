// V4 Supplier Intelligence Engine v1

const DEFAULT_WEIGHTS = {
  reliability: 25,
  pricing: 20,
  moq: 15,
  delivery: 15,
  communication: 15,
  history: 10
};

function calculateSupplierScore(supplier, weights = DEFAULT_WEIGHTS) {
  const score =
    (supplier.reliability || 0) * weights.reliability / 100 +
    (supplier.pricing || 0) * weights.pricing / 100 +
    (supplier.moq || 0) * weights.moq / 100 +
    (supplier.delivery || 0) * weights.delivery / 100 +
    (supplier.communication || 0) * weights.communication / 100 +
    (supplier.history || 0) * weights.history / 100;

  return Math.round(score);
}

function evaluateSupplier(supplier) {
  const score = calculateSupplierScore(supplier);

  let status = 'high_risk';

  if (score >= 80) status = 'recommended';
  else if (score >= 60) status = 'review';

  return {
    ...supplier,
    supplierScore: score,
    status
  };
}

function rankSuppliers(suppliers = []) {
  return suppliers
    .map(evaluateSupplier)
    .sort((a, b) => b.supplierScore - a.supplierScore);
}

module.exports = {
  calculateSupplierScore,
  evaluateSupplier,
  rankSuppliers
};
