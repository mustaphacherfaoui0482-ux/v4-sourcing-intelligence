/**
 * GPT Sourcing Agent — V4 orchestration core v0.1
 *
 * This module is provider-agnostic. It owns workflow state and anti-loop rules;
 * V4 remains authoritative for deterministic business decisions.
 */

export const GPT_SOURCING_VERSION = '0.1.0';
export const MAX_AGENT_STEPS = 8;

export const STATES = Object.freeze([
  'RADAR', 'SIGNAL', 'OPPORTUNITY', 'EVIDENCE', 'CONFIDENCE',
  'SCORING', 'ECONOMICS', 'RISK', 'DECISION', 'ACTION', 'RESULT', 'LEARNING',
]);

export function createSourcingState({ target = '', actual = null } = {}) {
  return {
    version: GPT_SOURCING_VERSION,
    target,
    state: 'RADAR',
    actual,
    openGaps: [],
    closedGaps: [],
    lastAction: null,
    lastResult: null,
    nextAllowedAction: 'IDENTIFY_GAP',
    stepCount: 0,
    status: 'RUNNING',
    loopDetected: false,
  };
}

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function addGap(state, gap) {
  const key = normalizeKey(gap);
  if (!key) return state;
  if (state.closedGaps.some((item) => normalizeKey(item) === key)) return state;
  if (!state.openGaps.some((item) => normalizeKey(item) === key)) state.openGaps.push(gap);
  state.nextAllowedAction = 'RESOLVE_GAP';
  return state;
}

export function closeGap(state, gap, { newEvidence = false } = {}) {
  const key = normalizeKey(gap);
  const index = state.openGaps.findIndex((item) => normalizeKey(item) === key);
  if (index >= 0) state.openGaps.splice(index, 1);

  const alreadyClosed = state.closedGaps.some((item) => normalizeKey(item) === key);
  if (alreadyClosed && !newEvidence) {
    state.loopDetected = true;
    state.status = 'STOP';
    state.nextAllowedAction = 'STOP_LOOP_DETECTED';
    return state;
  }

  if (!alreadyClosed) state.closedGaps.push(gap);
  state.lastResult = { type: 'GAP_CLOSED', gap, newEvidence };
  state.nextAllowedAction = state.openGaps.length ? 'RESOLVE_GAP' : 'NEXT_STATE';
  return state;
}

export function recordAction(state, action) {
  state.stepCount += 1;
  state.lastAction = action;
  if (state.stepCount >= MAX_AGENT_STEPS) {
    state.status = 'STOP';
    state.nextAllowedAction = 'STOP_MAX_STEPS';
  }
  return state;
}

export function setState(state, nextState) {
  if (!STATES.includes(nextState)) throw new Error(`Invalid V4 state: ${nextState}`);
  state.state = nextState;
  return state;
}

export function stopState(state, reason, evidence = null) {
  state.status = 'STOP';
  state.nextAllowedAction = 'STOP';
  state.lastResult = { type: 'STOP', reason, evidence };
  return state;
}

export function buildAgentContext(state) {
  return {
    version: state.version,
    target: state.target,
    state: state.state,
    actual: state.actual,
    openGaps: [...state.openGaps],
    closedGaps: [...state.closedGaps],
    lastAction: state.lastAction,
    lastResult: state.lastResult,
    nextAllowedAction: state.nextAllowedAction,
    stepCount: state.stepCount,
    status: state.status,
    loopDetected: state.loopDetected,
  };
}

export function validateAgentOutput(output = {}) {
  const allowed = ['TESTER', 'APPROFONDIR', 'ATTENDRE', 'EVITER', 'STOP'];
  const decision = output.decision ?? 'STOP';
  if (!allowed.includes(decision)) throw new Error(`Invalid agent decision: ${decision}`);
  if (output.nextAction !== undefined && typeof output.nextAction !== 'string') {
    throw new Error('nextAction must be a string');
  }
  return { ...output, decision };
}
