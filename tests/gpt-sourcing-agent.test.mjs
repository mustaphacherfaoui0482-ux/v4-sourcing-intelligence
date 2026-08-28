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
import gptSourcingHandler from '../api/gpt-sourcing.js';

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

function mockResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function runGptStatusTest(status, details = {}) {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;
  const originalFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.OPENAI_MODEL = 'test-model';
  globalThis.fetch = async () => ({
    ok: details.httpOk ?? true,
    status: details.httpStatus ?? 200,
    async json() {
      if (status === 'OPENAI_ERROR') return { error: { message: details.error || 'provider failed' } };
      if (status === 'OPENAI_EMPTY') return { id: 'resp-empty', output: [] };
      if (status === 'OPENAI_INVALID_JSON') return { id: 'resp-invalid-json', output_text: '{invalid' };
      if (status === 'OPENAI_INVALID_OUTPUT') return { id: 'resp-invalid-output', output_text: JSON.stringify({ decision: 'MAYBE', reason: 'bad', nextAction: 'x', evidenceStatus: 'P1', gap: null }) };
      return {};
    },
  });

  try {
    const req = { method: 'POST', body: { target: 'Test OpenAI status' } };
    const res = mockResponse();
    await gptSourcingHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'STOP');
    assert.equal(res.body.state.status, 'STOP');
    assert.ok(res.body.state.lastResult);
    const expectedReason = details.error || status;
    assert.equal(res.body.state.lastResult.reason, expectedReason);
    assert.equal(res.body.gpt.status, status);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalModel;
  }
}

test('handler terminalises NOT_CONFIGURED when OpenAI configuration is missing', async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;
  try {
    const res = mockResponse();
    await gptSourcingHandler({ method: 'POST', body: { target: 'Test missing config' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'STOP');
    assert.equal(res.body.gpt.status, 'NOT_CONFIGURED');
    assert.equal(res.body.state.lastResult.reason, 'OPENAI_API_KEY missing');
  } finally {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalModel;
  }
});

test('handler terminalises OPENAI_ERROR', async () => runGptStatusTest('OPENAI_ERROR', { httpOk: false, httpStatus: 500, error: 'provider failed' }));
test('handler terminalises OPENAI_EMPTY', async () => runGptStatusTest('OPENAI_EMPTY'));
test('handler terminalises OPENAI_INVALID_JSON', async () => runGptStatusTest('OPENAI_INVALID_JSON'));
test('handler terminalises OPENAI_INVALID_OUTPUT', async () => runGptStatusTest('OPENAI_INVALID_OUTPUT'));
