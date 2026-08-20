/**
 * V4 Sourcing Intelligence — Dashboard Core v1
 * Presentation data layer. No UI framework dependency.
 */

export function buildDashboardState({
  opportunities = [],
  connectors = [],
  decisions = [],
} = {}) {
  return {
    summary: {
      opportunities: opportunities.length,
      activeConnectors: connectors.filter(c => c.status === 'connected').length,
      pendingConnectors: connectors.filter(c => c.status === 'configuration_required').length,
      decisions: decisions.length,
    },
    radar: opportunities.map(item => ({
      id: item.id,
      name: item.name,
      score: item.score || 0,
      status: item.status || 'unknown',
    })),
    connectors,
    decisions,
    generatedAt: new Date().toISOString(),
  };
}
