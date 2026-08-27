import { evaluateOpportunity } from './decision-engine.js';

/**
 * V4 remains authoritative after source inspection. This adapter only evaluates
 * fields already present in the inspected candidate; it never invents scores.
 */
export function evaluateInspectedEvidence(extracted) {
  if (!extracted || typeof extracted !== 'object') return null;
  return evaluateOpportunity(extracted);
}
