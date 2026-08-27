import assert from 'node:assert/strict';
import test from 'node:test';
import { createSourcingState, recordAction } from '../modules/gpt-sourcing-agent.js';

test('same tool with different query is a new action', () => {
  const state = createSourcingState({ target: 'source product' });
  recordAction(state, { name: 'search_source', source: 'web', query: 'thermal camera' });
  recordAction(state, { name: 'search_source', source: 'web', query: 'portable thermal camera' });
  assert.equal(state.status, 'RUNNING');
  assert.equal(state.loopDetected, false);
  assert.equal(state.stepCount, 2);
});

test('same tool with same inputs is detected as a loop', () => {
  const state = createSourcingState({ target: 'source product' });
  recordAction(state, { name: 'search_source', source: 'web', query: 'thermal camera' });
  recordAction(state, { name: 'search_source', source: 'web', query: 'thermal camera' });
  assert.equal(state.status, 'STOP');
  assert.equal(state.loopDetected, true);
  assert.equal(state.nextAllowedAction, 'STOP_LOOP_DETECTED');
});
