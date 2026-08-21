/**
 * V4 Sourcing Intelligence — Evidence Confidence Engine v1
 *
 * Confidence is kept separate from opportunity potential.
 * The engine never invents external evidence: it only evaluates evidence
 * explicitly supplied to the Opportunity model.
 */

const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

/**
 * Evidence shape (recommended):
 * {
 *   source: 'Alibaba',
 *   type: 'supplier_price',
 *   strength: 0..100,
 *   verified: true|false
 * }
 */
export function calculateEvidenceConfidence(evidence = [], fallback = 0) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    const confidence = clamp(fallback);
    return {
      score: confidence,
      level: confidenceLevel(confidence),
      evidenceCount: 0,
      verifiedCount: 0,
      source: confidence > 0 ? 'declared' : 'missing',
    };
  }

  const normalized = evidence.map((item) => ({
    strength: clamp(item?.strength),
    verified: item?.verified === true,
  }));

  const averageStrength = normalized.reduce((sum, item) => sum + item.strength, 0) / normalized.length;
  const verificationRate = normalized.filter((item) => item.verified).length / normalized.length * 100;

  // Evidence quality is deliberately transparent: 60% evidence strength + 40% verification.
  const score = Math.round(averageStrength * 0.6 + verificationRate * 0.4);

  return {
    score,
    level: confidenceLevel(score),
    evidenceCount: normalized.length,
    verifiedCount: normalized.filter((item) => item.verified).length,
    source: 'evidence',
  };
}

function confidenceLevel(score) {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'low';
  return 'very_low';
}

export default calculateEvidenceConfidence;
