/**
 * V4 Sourcing Intelligence — Opportunity Board v1
 * Display preparation layer for ranked product opportunities.
 */

export function createOpportunityBoard(opportunities = []) {
  return [...opportunities]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((item) => ({
      id: item.id,
      product: item.product || 'Unknown product',
      score: item.score || 0,
      margin: item.margin || 0,
      risk: item.risk || 'unknown',
      decision: item.decision || 'review',
      supplier: item.supplier || null,
    }));
}

export function filterByDecision(board = [], decision) {
  return board.filter((item) => item.decision === decision);
}

export function filterLowRisk(board = []) {
  return board.filter((item) => item.risk !== 'high');
}
