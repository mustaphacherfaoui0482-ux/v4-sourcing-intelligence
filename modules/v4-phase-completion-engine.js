// V4 Phase Completion Engine v1

const PHASE_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  REVIEW: 'review'
};

function createPhase(name, checks = []) {
  return {
    name,
    checks,
    status: checks.length ? PHASE_STATUS.REVIEW : PHASE_STATUS.ACTIVE,
    createdAt: new Date().toISOString()
  };
}

function completePhase(phase = {}) {
  return {
    ...phase,
    status: PHASE_STATUS.COMPLETED,
    completedAt: new Date().toISOString()
  };
}

function getStatus() {
  return {
    module: 'v4-phase-completion-engine',
    status: 'ready'
  };
}

module.exports = {
  PHASE_STATUS,
  createPhase,
  completePhase,
  getStatus
};
