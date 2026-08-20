export function calculateWinnerScore(product = {}) {
  const signals = {
    trend: product.trend || 0,
    demand: product.demand || 0,
    ads: product.ads || 0,
    competition: product.competition || 0,
    margin: product.margin || 0,
    supplier: product.supplier || 0,
    risk: product.risk || 0,
    reliability: product.reliability || 0
  };

  const score = Math.round(
    signals.trend * 0.15 +
    signals.demand * 0.20 +
    signals.ads * 0.15 +
    signals.competition * 0.10 +
    signals.margin * 0.15 +
    signals.supplier * 0.10 +
    signals.risk * 0.05 +
    signals.reliability * 0.10
  );

  return {
    score,
    status: score >= 85 ? 'winner_candidate' : score >= 65 ? 'review' : 'weak',
    signals
  };
}

export function detectWinner(products = []) {
  return products
    .map(product => ({
      ...product,
      winnerAnalysis: calculateWinnerScore(product)
    }))
    .sort((a, b) => b.winnerAnalysis.score - a.winnerAnalysis.score);
}
