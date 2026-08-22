// V4 Sourcing Intelligence — Gate Engine v1
// Gates protect the decision layer. They never produce an opportunity score.

export const GATE_LEVELS = Object.freeze({
  NONE: 'NONE',
  MINOR: 'MINEUR',
  MAJOR: 'MAJEUR',
  BLOCKING: 'BLOQUANT',
});

const clamp = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback;
};

function addGate(gates, code, level, message, status = 'confirmed', resolution = null) {
  gates.push({ code, level, status, message, resolution });
}

export function evaluateGates(input = {}) {
  const gates = [];
  const confidence = clamp(input.confidence ?? input.dataConfidence);
  const offer = input.offer ?? null;
  const economics = input.economics ?? input.offerEconomics ?? null;

  if (offer && economics?.status === 'loss') {
    addGate(gates, 'G-ECO-01', GATE_LEVELS.BLOCKING, 'Contribution économique négative.', 'confirmed', 'EVITER');
  }

  if (Number.isFinite(Number(input.profitabilityScore)) && Number(input.profitabilityScore) < 40) {
    addGate(gates, 'G-ECO-02', GATE_LEVELS.BLOCKING, 'Viabilité économique insuffisante.', 'confirmed', 'EVITER');
  }

  if (input.landedCostRequired && !Number.isFinite(Number(input.landedCost))) {
    addGate(gates, 'G-ECO-04', GATE_LEVELS.MAJOR, 'Coût rendu nécessaire mais non vérifié.', 'unresolved', 'ATTENDRE');
  }

  if (input.regulatory?.prohibited === true || input.regulatory?.compliant === false) {
    addGate(gates, 'G-REG-01', GATE_LEVELS.BLOCKING, 'Conformité réglementaire incompatible ou commercialisation interdite.', 'confirmed', 'EVITER');
  } else if (input.regulatory?.required === true && input.regulatory?.verified !== true) {
    addGate(gates, 'G-REG-02', GATE_LEVELS.BLOCKING, 'Obligation réglementaire potentiellement bloquante non vérifiée.', 'unresolved', 'ATTENDRE');
  }

  if (input.supplierVerified === false) {
    addGate(gates, 'G-SUP-01', GATE_LEVELS.MAJOR, 'Fournisseur non vérifié.', 'unresolved', 'ATTENDRE');
  }

  if (input.supplier?.compatible === false) {
    addGate(gates, 'G-SUP-02', GATE_LEVELS.BLOCKING, 'Fournisseur incompatible avec une contrainte essentielle.', 'confirmed', 'EVITER');
  }

  if (input.quality?.failed === true) {
    addGate(gates, 'G-QUA-01', GATE_LEVELS.BLOCKING, 'Défaut qualité critique confirmé.', 'confirmed', 'EVITER');
  } else if (input.quality?.required === true && input.quality?.verified !== true) {
    addGate(gates, 'G-QUA-02', GATE_LEVELS.MAJOR, 'Validation qualité encore manquante.', 'unresolved', 'TESTER');
  }

  if (input.logistics?.incompatible === true) {
    addGate(gates, 'G-LOG-01', GATE_LEVELS.BLOCKING, 'Contraintes logistiques incompatibles.', 'confirmed', 'EVITER');
  }

  if (confidence < 50) {
    addGate(gates, 'G-DATA-01', GATE_LEVELS.MAJOR, 'Confiance insuffisante pour une décision ferme.', 'unresolved', 'ATTENDRE');
  }

  if (input.criticalDataMissing === true) {
    addGate(gates, 'G-DATA-02', GATE_LEVELS.MAJOR, 'Une donnée critique manque pour conclure.', 'unresolved', 'ATTENDRE');
  }

  const blocking = gates.filter((gate) => gate.level === GATE_LEVELS.BLOCKING);
  const unresolvedBlocking = blocking.filter((gate) => gate.status === 'unresolved');
  const confirmedBlocking = blocking.filter((gate) => gate.status === 'confirmed');
  const major = gates.filter((gate) => gate.level === GATE_LEVELS.MAJOR);

  return {
    gates,
    counts: {
      blocking: blocking.length,
      confirmedBlocking: confirmedBlocking.length,
      unresolvedBlocking: unresolvedBlocking.length,
      major: major.length,
    },
    hasConfirmedBlocking: confirmedBlocking.length > 0,
    hasUnresolvedCritical: unresolvedBlocking.length > 0,
    hasMajor: major.length > 0,
  };
}

export default evaluateGates;
