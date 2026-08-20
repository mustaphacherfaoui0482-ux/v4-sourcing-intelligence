// V4 Sourcing Intelligence
// Product Intelligence Engine v1

export const analyzeProduct = (product = {}) => {
  const signals = {
    demand: product.demand || 0,
    marketing: product.marketing || 0,
    sourcing: product.sourcing || 0,
    profitability: product.profitability || 0,
    confidence: product.confidence || 0
  };

  const total = Math.round(
    signals.demand * 0.25 +
    signals.marketing * 0.20 +
    signals.sourcing * 0.20 +
    signals.profitability * 0.25 +
    signals.confidence * 0.10
  );

  return {
    product: product.name || 'unknown',
    signals,
    score: total,
    classification:
      total >= 80 ? 'winner_candidate' :
      total >= 60 ? 'promising' :
      total >= 40 ? 'review' :
      'weak_signal'
  };
};

export default analyzeProduct;
