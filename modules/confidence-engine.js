// V4 Sourcing Intelligence — Confidence Engine v1
// Confidence describes how much trust can be placed in the conclusion.

const clamp = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback;
};

export function calculateConfidence(input = {}) {
  const explicit = Number(input.confidence ?? input.dataConfidence);
  if (Number.isFinite(explicit)) return Math.round(clamp(explicit));

  const evidenceQuality = clamp(input.evidenceQuality);
  const sourceIndependence = clamp(input.sourceIndependence);
  const completeness = clamp(input.dataCompleteness);
  const recency = clamp(input.dataRecency);
  const crossValidation = clamp(input.crossValidation);

  const available = [evidenceQuality, sourceIndependence, completeness, recency, crossValidation]
    .filter((value) => value > 0);

  if (available.length === 0) return 0;

  const weights = [0.35, 0.15, 0.20, 0.10, 0.20];
  const values = [evidenceQuality, sourceIndependence, completeness, recency, crossValidation];
  const known = values.map((value, index) => ({ value, weight: weights[index] }))
    .filter(({ value }) => value > 0);
  const totalWeight = known.reduce((sum, item) => sum + item.weight, 0);
  const score = known.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;

  return Math.round(clamp(score));
}

export default calculateConfidence;
