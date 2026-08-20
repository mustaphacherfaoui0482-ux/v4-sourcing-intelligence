// V4 Master Scoring Engine v1
// Aggregates intelligence scores into a final V4 decision score.

function clampScore(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function calculateMasterScore(data = {}) {
  const weights = {
    winner: 0.25,
    market: 0.2,
    supplier: 0.2,
    reliability: 0.15,
    profit: 0.15,
    risk: 0.05
  };

  const riskScore = 100 - clampScore(data.risk);

  const score =
    clampScore(data.winner) * weights.winner +
    clampScore(data.market) * weights.market +
    clampScore(data.supplier) * weights.supplier +
    clampScore(data.reliability) * weights.reliability +
    clampScore(data.profit) * weights.profit +
    riskScore * weights.risk;

  return Math.round(score);
}

function evaluateV4Opportunity(data = {}) {
  const score = calculateMasterScore(data);

  let status = "review";
  if (score >= 85) status = "priority_test";
  if (score < 60) status = "reject";

  return {
    score,
    status,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  calculateMasterScore,
  evaluateV4Opportunity
};
