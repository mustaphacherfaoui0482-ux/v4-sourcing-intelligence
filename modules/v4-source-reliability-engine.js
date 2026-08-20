// V4 Source Reliability Engine v1

const sourceReliability = [];

function evaluateSource(source) {
  const score = Math.max(0, Math.min(100,
    (source.dataQuality || 0) * 0.4 +
    (source.updateFrequency || 0) * 0.3 +
    (source.stability || 0) * 0.3
  ));

  return {
    name: source.name,
    reliabilityScore: Math.round(score),
    status: score >= 80 ? 'trusted' : score >= 50 ? 'review' : 'low_confidence'
  };
}

function registerSourceEvaluation(source) {
  const evaluation = evaluateSource(source);
  sourceReliability.push(evaluation);
  return evaluation;
}

function getSourceReliability() {
  return sourceReliability;
}

export {
  evaluateSource,
  registerSourceEvaluation,
  getSourceReliability
};
