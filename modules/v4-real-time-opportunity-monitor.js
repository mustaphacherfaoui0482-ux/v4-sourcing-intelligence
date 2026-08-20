// V4 Real-Time Opportunity Monitor v1

const opportunities = [];

function addSignal(signal) {
  opportunities.push({
    ...signal,
    timestamp: new Date().toISOString()
  });
}

function monitorSignals(signals = []) {
  signals.forEach(addSignal);
  return rankSignals(opportunities);
}

function rankSignals(items = []) {
  return [...items].sort((a, b) => (b.score || 0) - (a.score || 0));
}

function getAlerts(minScore = 85) {
  return opportunities.filter(item => (item.score || 0) >= minScore);
}

module.exports = {
  addSignal,
  monitorSignals,
  rankSignals,
  getAlerts
};
