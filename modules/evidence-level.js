// V4 Sourcing Intelligence — Evidence Level V1
// Evidence strength is independent from potential and confidence.

export const EVIDENCE_LEVELS = Object.freeze({
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
});

const ORDER = Object.freeze({ P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 });

export function normalizeEvidenceLevel(value) {
  return Object.hasOwn(ORDER, value) ? value : EVIDENCE_LEVELS.P0;
}

export function compareEvidenceLevel(a, b) {
  return ORDER[normalizeEvidenceLevel(a)] - ORDER[normalizeEvidenceLevel(b)];
}

export function isVerifiedEvidence(value) {
  return compareEvidenceLevel(value, EVIDENCE_LEVELS.P3) >= 0;
}
