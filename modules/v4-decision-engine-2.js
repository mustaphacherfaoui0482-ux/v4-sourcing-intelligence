// V4 Decision Engine 2.0
// Converts analysis results into actionable decisions.

function decide(product) {
  const score = product.winnerScore || 0;
  const confidence = product.confidence || 0;
  const risk = product.risk || 0;

  if (confidence < 50) {
    return { decision: 'REQUEST_MORE_DATA', reason: 'Insufficient data confidence' };
  }

  if (risk > 70) {
    return { decision: 'REJECT', reason: 'High risk level' };
  }

  if (score >= 85) {
    return { decision: 'TEST', reason: 'Strong V4 opportunity' };
  }

  if (score >= 60) {
    return { decision: 'MONITOR', reason: 'Potential opportunity' };
  }

  return { decision: 'REJECT', reason: 'Low potential score' };
}

module.exports = { decide };
