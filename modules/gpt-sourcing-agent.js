/**
 * GPT Sourcing Agent — V4 orchestration core v1.0
 *
 * Provider-agnostic workflow state. V4 remains authoritative for
 * deterministic business decisions.
 */

export const GPT_SOURCING_VERSION = '1.0.0';
export const MAX_AGENT_STEPS = 8;

export const STATES = Object.freeze([
  'RADAR', 'SIGNAL', 'OPPORTUNITY', 'EVIDENCE', 'CONFIDENCE',
  'SCORING', 'ECONOMICS', 'RISK', 'DECISION', 'ACTION', 'RESULT', 'LEARNING',
]);

export const TERMINAL_AGENT_STATUSES = Object.freeze([
  'STOP',
  'COMPLETED',
]);

export function createSourcingState({ target = '', actual = null } = {}) {
  return {
    version: GPT_SOURCING_VERSION,
    target,
    state: 'RADAR',
    actual,
    openGaps: [],
    closedGaps: [],
    actionHistory: [],
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

function gapKey(gap) {
  return normalizeKey(gap);
}

function actionKey(action) {
  if (typeof action === 'string') return normalizeKey(action);
  if (!action || typeof action !== 'object') return normalizeKey(action);
  const source = normalizeKey(action.source);
  const query = normalizeKey(action.query);
  const url = normalizeKey(action.url);
  const name = normalizeKey(action.name || action.action || action.tool);
  return [name, source, query, url].filter(Boolean).join('|');
}

export function addGap(state, gap, { newEvidence = false } = {}) {
  const key = gapKey(gap);
  if (!key || state.status !== 'RUNNING') return state;

  const closed = state.closedGaps.find((item) => gapKey(item) === key);
  if (closed && !newEvidence) return state;

  if (closed && newEvidence) {
    state.closedGaps = state.closedGaps.filter((item) => gapKey(item) !== key);
  }

  if (!state.openGaps.some((item) => gapKey(item) === key)) state.openGaps.push(gap);
  state.nextAllowedAction = 'RESOLVE_GAP';
  return state;
}

export function closeGap(state, gap, { newEvidence = false } = {}) {
  const key = gapKey(gap);
  if (!key || state.status !== 'RUNNING') return state;

  const index = state.openGaps.findIndex((item) => gapKey(item) === key);
  const alreadyClosed = state.closedGaps.some((item) => gapKey(item) === key);

  if (alreadyClosed && !newEvidence) {
    state.loopDetected = true;
    state.status = 'STOP';
    state.nextAllowedAction = 'STOP_LOOP_DETECTED';
    state.lastResult = { type: 'STOP', reason: 'LOOP_DETECTED', evidence: { gap } };
    return state;
  }

  if (index >= 0) state.openGaps.splice(index, 1);
  if (!alreadyClosed) state.closedGaps.push(gap);
  state.lastResult = { type: 'GAP_CLOSED', gap, newEvidence };
  state.nextAllowedAction = state.openGaps.length ? 'RESOLVE_GAP' : 'NEXT_STATE';
  return state;
}

export function recordAction(state, action) {
  if (state.status !== 'RUNNING') return state;

  const key = actionKey(action);
  if (!key) return state;

  if (state.actionHistory.some((item) => actionKey(item) === key)) {
    state.loopDetected = true;
    state.status = 'STOP';
    state.nextAllowedAction = 'STOP_LOOP_DETECTED';
    state.lastResult = { type: 'STOP', reason: 'LOOP_DETECTED', evidence: { action } };
    return state;
  }

  state.stepCount += 1;
  state.lastAction = action;
  state.actionHistory.push(action);

  if (state.stepCount >= MAX_AGENT_STEPS) {
    state.status = 'STOP';
    state.nextAllowedAction = 'STOP_MAX_STEPS';
    state.lastResult = { type: 'STOP', reason: 'MAX_STEPS_REACHED', evidence: { max: MAX_AGENT_STEPS } };
  }
  return state;
}

export function setState(state, nextState) {
  if (state.status !== 'RUNNING') return state;
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

export function completeState(state, result = null) {
  state.status = 'COMPLETED';
  state.nextAllowedAction = 'STOP';
  state.lastResult = { type: 'COMPLETED', result };
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
    actionHistory: [...state.actionHistory],
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
  if (typeof output.reason !== 'string') throw new Error('reason must be a string');
  if (typeof output.nextAction !== 'string') throw new Error('nextAction must be a string');
  if (typeof output.evidenceStatus !== 'string') throw new Error('evidenceStatus must be a string');
  if (output.gap !== null && typeof output.gap !== 'string') throw new Error('gap must be a string or null');
  return { ...output, decision };
}
