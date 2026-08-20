// V4 Market Intelligence Engine v2

const MARKET_STATUS = {
  STRONG: 'strong',
  REVIEW: 'review',
  WEAK: 'weak'
};

const signals = [];

function calculateMarketScore(data = {}) {
  const trend = Number(data.trend || 0);
  const demand = Number(data.demand || 0);
  const competition = Number(data.competition || 0);
  const seasonality = Number(data.seasonality || 0);
  const opportunity = Number(data.opportunity || 0);

  const score = Math.round(
    trend * 0.25 +
    demand * 0.3 +
    competition * 0.15 +
    seasonality * 0.15 +
    opportunity * 0.15
  );

  return Math.max(0, Math.min(100, score));
}

function evaluateMarket(data = {}) {
  const score = calculateMarketScore(data);

  let status = MARKET_STATUS.WEAK;

  if (score >= 80) status = MARKET_STATUS.STRONG;
  else if (score >= 50) status = MARKET_STATUS.REVIEW;

  return {
    score,
    status,
    market: data.market || null
  };
}

function addSignal(signal = {}) {
  signals.push({
    ...signal,
    createdAt: new Date().toISOString()
  });

  return signals[signals.length - 1];
}

function getSignals() {
  return signals;
}

function getStatus() {
  return {
    module: 'v4-market-intelligence-engine',
    status: 'active'
  };
}

module.exports = {
  calculateMarketScore,
  evaluateMarket,
  addSignal,
  getSignals,
  getStatus,
  MARKET_STATUS
};
