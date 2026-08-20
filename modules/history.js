// V4 Sourcing Intelligence - History Module
// Stores traceable analysis events.

export function createHistoryEntry(data) {
  return {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    source: data.source || 'unknown',
    product: data.product || null,
    score: data.score || null,
    decision: data.decision || null,
    confidence: data.confidence || 'unknown'
  };
}

export function appendHistory(history, entry) {
  return [...history, entry];
}
