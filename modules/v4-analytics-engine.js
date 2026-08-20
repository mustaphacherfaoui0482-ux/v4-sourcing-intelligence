/**
 * V4 Sourcing Intelligence — Analytics Engine v1
 * Deterministic business analytics layer.
 */

const average = (values = []) => {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + Number(b || 0), 0) / values.length);
};

export function generateAnalytics(data = {}) {
  const opportunities = data.opportunities || [];
  const tests = data.tests || [];

  const confirmedWinners = tests.filter(
    (item) => item.status === 'winner_confirmed'
  ).length;

  const rejectedProducts = tests.filter(
    (item) => item.status === 'reject'
  ).length;

  const categories = {};
  opportunities.forEach((item) => {
    const category = item.category || 'unknown';
    categories[category] = (categories[category] || 0) + 1;
  });

  return {
    totalOpportunities: opportunities.length,
    successRate: tests.length
      ? Math.round((confirmedWinners / tests.length) * 100)
      : 0,
    rejectionRate: tests.length
      ? Math.round((rejectedProducts / tests.length) * 100)
      : 0,
    averageScore: average(opportunities.map((item) => item.score)),
    averageMargin: average(opportunities.map((item) => item.margin)),
    topCategories: categories,
    generatedAt: new Date().toISOString(),
  };
}
