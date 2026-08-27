import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_AGENT_STEPS,
  addGap,
  buildAgentContext,
  closeGap,
  createSourcingState,
  recordAction,
  stopState,
  validateAgentOutput,
} from '../modules/gpt-sourcing-agent.js';

test('GPT sourcing state preserves unknown gaps and exposes next action', () => {
  const state = createSourcingState({ target: 'Tester un produit' });
  addGap(state, 'Prix fournisseur vérifié');
  const context = buildAgentContext(state);
  assert.deepEqual(context.openGaps, ['Prix fournisseur vérifié']);
  assert.equal(context.nextAllowedAction, 'RESOLVE_GAP');
});

test('closed GAP cannot be reopened without new evidence', () => {
  const state = createSourcingState({ target: 'Test' });
  addGap(state, 'MOQ');
  closeGap(state, 'MOQ');
  addGap(state, 'MOQ');
  closeGap(state, 'MOQ');
  assert.equal(state.loopDetected, true);
  assert.equal(state.status, 'STOP');
  assert.equal(state.nextAllowedAction, 'STOP_LOOP_DETECTED');
});

test('new evidence may legitimately reopen a closed GAP', () => {
  const state = createSourcingState({ target: 'Test' });
  addGap(state, 'MOQ');
  closeGap(state, 'MOQ');
  addGap(state, 'MOQ');
  closeGap(state, 'MOQ', { newEvidence: true });
  assert.equal(state.loopDetected, false);
  assert.equal(state.status, 'RUNNING');
});

test('agent stops at maximum step budget', () => {
  const state = createSourcingState({ target: 'Test' });
  for (let i = 0; i < MAX_AGENT_STEPS; i += 1) recordAction(state, `ACTION_${i}`);
  assert.equal(state.status, 'STOP');
  assert.equal(state.nextAllowedAction, 'STOP_MAX_STEPS');
});

test('agent output accepts only V4 decisions', () => {
  const valid = {
    reason: 'données insuffisantes',
    nextAction: 'collecter la preuve manquante',
    evidenceStatus: 'P1',
    gap: null,
  };
  assert.equal(validateAgentOutput({ ...valid, decision: 'ATTENDRE' }).decision, 'ATTENDRE');
  assert.throws(() => validateAgentOutput({ ...valid, decision: 'MAYBE' }));
});

test('explicit STOP records reason and evidence', () => {
  const state = createSourcingState({ target: 'Test' });
  stopState(state, 'BLOCKED', { field: 'price', value: null });
  assert.equal(state.status, 'STOP');
  assert.equal(state.lastResult.reason, 'BLOCKED');
});
