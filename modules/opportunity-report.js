/**
 * V4 Sourcing Intelligence — Opportunity Report v1
 * Human-readable synthesis layer.
 */

export function createOpportunityReport(opportunity = {}) {
  return {
    title: opportunity.productName || 'Unknown product',
    score: opportunity.score ?? 0,
    decision: opportunity.decision || 'REVIEW',
    confidence: opportunity.confidence ?? 0,
    summary: {
      demand: opportunity.demand || null,
      marketing: opportunity.marketing || null,
      supplier: opportunity.supplier || null,
      profitability: opportunity.profitability || null,
      risks: opportunity.risks || [],
    },
    recommendation: opportunity.recommendation || 'Additional validation required',
    generatedAt: new Date().toISOString(),
  };
}
