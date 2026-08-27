import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_AGENT_STEPS,
  addGap,
  buildAgentContext,
  closeGap,
  createSourcingState,
  executeSourceInspection,
  executeSourceSearch,
  recordAction,
  stopState,
  validateAgentOutput,
} from '../modules/gpt-sourcing-agent.js';
import { createSourceAdapter } from '../modules/source-adapter.js';

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

test('GPT agent executes source search then inspection into V4 evidence boundary', async () => {
  const adapter = createSourceAdapter({
    demo: {
      search: async (query) => [{ product: query, reference: 'demo-1' }],
      inspectProduct: async () => ({
        product: 'Thermal camera',
        supplier: 'Demo Supplier',
        price: 42,
        currency: 'USD',
        moq: undefined,
        url: 'https://example.test/demo-1',
      }),
    },
  });

  const state = createSourcingState({ target: 'Trouver une caméra thermique' });
  const searched = await executeSourceSearch(state, adapter, 'demo', 'smartphone thermal camera');
  assert.equal(searched.results[0].reference, 'demo-1');
  assert.equal(state.nextAllowedAction, 'INSPECT_SOURCE_PRODUCT');

  const inspected = await executeSourceInspection(state, adapter, 'demo', 'demo-1', {
    evidenceStatus: 'P2',
    observedAt: '2026-08-27T00:00:00Z',
  });

  assert.equal(inspected.evidence.product.value, 'Thermal camera');
  assert.equal(inspected.evidence.price.value, 42);
  assert.equal(inspected.evidence.moq.value, null);
  assert.equal(inspected.evidence.moq.evidenceStatus, 'P2');
  assert.equal(inspected.evidence.supplier.source, 'demo');
  assert.equal(state.lastResult.type, 'SOURCE_INSPECTION');
  assert.equal(state.stepCount, 2);
});
