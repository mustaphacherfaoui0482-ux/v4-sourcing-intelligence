/**
 * V4 Sourcing Intelligence — Dashboard UI Foundation
 * Presentation layer only. No business logic.
 */

export function createDashboardView(data = {}) {
  return {
    radar: data.radar || [],
    opportunities: data.opportunities || [],
    connectors: data.connectors || [],
    decisions: data.decisions || [],
    generatedAt: new Date().toISOString(),
  };
}

export function getOpportunityCard(opportunity = {}) {
  return {
    product: opportunity.product || 'Unknown',
    score: opportunity.score || 0,
    decision: opportunity.decision || 'review',
    risks: opportunity.risks || [],
  };
}
