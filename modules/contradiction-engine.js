// V4 Sourcing Intelligence — Contradiction Engine v1
// Detects decision-relevant conflicts without resolving them by averaging scores.

export function detectContradictions(input = {}) {
  const contradictions = [];
  const potential = Number(input.potential);
  const economics = Number(input.economicsScore ?? input.profitabilityScore);
  const confidence = Number(input.confidence ?? input.dataConfidence);
  const risk = Number(input.riskScore);

  if (Number.isFinite(potential) && potential >= 85 && Number.isFinite(economics) && economics < 50) {
    contradictions.push({
      code: 'C-ECO-01',
      severity: 'critical',
      message: 'Potentiel commercial élevé mais économie insuffisante.',
    });
  }

  if (Number.isFinite(potential) && potential >= 85 && Number.isFinite(confidence) && confidence < 60) {
    contradictions.push({
      code: 'C-DATA-01',
      severity: 'major',
      message: 'Opportunité attractive mais preuves/confiance insuffisantes.',
    });
  }

  if (Number.isFinite(potential) && potential >= 85 && Number.isFinite(risk) && risk >= 70) {
    contradictions.push({
      code: 'C-RISK-01',
      severity: 'critical',
      message: 'Potentiel élevé mais exposition au risque critique.',
    });
  }

  if (input.regulatory?.required === true && input.regulatory?.verified !== true) {
    contradictions.push({
      code: 'C-REG-01',
      severity: 'critical',
      message: 'Attractivité commerciale non résolue face à une contrainte réglementaire inconnue.',
    });
  }

  if (Number.isFinite(input.moq) && input.moq > Number(input.maxTestQuantity ?? 500)) {
    contradictions.push({
      code: 'C-MOQ-01',
      severity: 'major',
      message: 'Opportunité intéressante mais exposition initiale potentiellement trop élevée.',
    });
  }

  return {
    contradictions,
    hasCritical: contradictions.some((item) => item.severity === 'critical'),
    hasMajor: contradictions.some((item) => item.severity === 'major'),
  };
}

export default detectContradictions;
