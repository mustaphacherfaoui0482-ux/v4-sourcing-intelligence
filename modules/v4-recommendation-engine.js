// V4 Recommendation Engine v1
// Data-driven recommendation layer

const recommendations = [];

function addRecommendation(item) {
  recommendations.push({
    ...item,
    createdAt: new Date().toISOString()
  });
}

function rankRecommendations() {
  return [...recommendations].sort((a, b) => (b.score || 0) - (a.score || 0));
}

function getTopRecommendations(limit = 10) {
  return rankRecommendations().slice(0, limit);
}

function getStatus() {
  return {
    engine: 'V4 Recommendation Engine',
    mode: 'data_driven',
    count: recommendations.length
  };
}

module.exports = {
  addRecommendation,
  rankRecommendations,
  getTopRecommendations,
  getStatus
};
