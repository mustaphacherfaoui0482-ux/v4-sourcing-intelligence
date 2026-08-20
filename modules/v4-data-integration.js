/**
 * V4 Sourcing Intelligence — Data Integration Layer v1
 * Connects analysis workflow with persistent data structures.
 */

export function saveOpportunityResult(dataLayer, opportunity) {
  if (!dataLayer || !opportunity) {
    return { saved: false, reason: 'missing_data' };
  }

  const product = dataLayer.create('products', opportunity.product || {});
  const supplier = dataLayer.create('suppliers', opportunity.supplier || {});
  const analysis = dataLayer.create('analyses', opportunity.analysis || {});
  const decision = dataLayer.create('decisions', opportunity.decision || {});
  const history = dataLayer.create('history', {
    productId: product.id,
    supplierId: supplier.id,
    analysisId: analysis.id,
    decisionId: decision.id,
    createdAt: new Date().toISOString()
  });

  return {
    saved: true,
    references: {
      product,
      supplier,
      analysis,
      decision,
      history
    }
  };
}
