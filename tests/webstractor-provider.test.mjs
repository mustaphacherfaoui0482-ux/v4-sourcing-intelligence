import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourcingState, executeSourceInspection, executeSourceSearch } from '../modules/gpt-sourcing-agent.js';
import { createSourceAdapter } from '../modules/source-adapter.js';
import { createWebstractorProvider } from '../modules/webstractor-provider.js';

test('Webstractor provider is wired to the V4 source adapter contract', async () => {
  const provider = createWebstractorProvider({
    apiKey: 'test-key',
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('/search')) {
      return new Response(JSON.stringify({
        schemaVersion: 1,
        type: 'feed',
        source: 'web-search',
        items: [{ type: 'document', title: 'Thermal camera', url: 'https://example.test/product' }],
      }), { status: 200 });
    }
    return new Response(JSON.stringify({
      schemaVersion: 1,
      type: 'product',
      source: 'web',
      url: 'https://example.test/product',
      title: 'Thermal camera',
      attributes: { price: 42, currency: 'USD', moq: null },
    }), { status: 200 });
  };

  try {
    const adapter = createSourceAdapter({ Webstractor: provider });
    const state = createSourcingState({ target: 'Tester Webstractor' });
    const searched = await executeSourceSearch(state, adapter, 'Webstractor', 'thermal camera');
    assert.equal(searched.results.length, 1);
    assert.equal(searched.results[0].reference, 'https://example.test/product');

    const inspected = await executeSourceInspection(
      state,
      adapter,
      'Webstractor',
      searched.results[0].reference,
      { evidenceStatus: 'P2', observedAt: '2026-08-27T00:00:00Z' },
    );

    assert.equal(inspected.evidence.product.value, 'Thermal camera');
    assert.equal(inspected.evidence.url.value, 'https://example.test/product');
    assert.equal(inspected.evidence.price.value, 42);
    assert.equal(inspected.evidence.moq.value, null);
    assert.equal(inspected.evidence.moq.evidenceStatus, 'P2');
    assert.equal(state.stepCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Webstractor real provider test is opt-in', { skip: !process.env.RUN_REAL_PROVIDER_TEST }, async () => {
  const adapter = createSourceAdapter({ Webstractor: createWebstractorProvider() });
  const state = createSourcingState({ target: 'Real Webstractor provider test' });
  const searched = await executeSourceSearch(state, adapter, 'Webstractor', 'smartphone thermal camera product');
  assert.ok(searched.results.length > 0, 'Webstractor search returned no results');
  const reference = searched.results[0].reference;
  assert.ok(reference, 'Webstractor search result has no URL');

  const inspected = await executeSourceInspection(
    state,
    adapter,
    'Webstractor',
    reference,
    { evidenceStatus: 'P2', observedAt: new Date().toISOString() },
  );

  assert.equal(inspected.evidence.url.value, reference);
  assert.equal(inspected.evidence.url.source, 'Webstractor');
  assert.ok(inspected.evidence.product.value || inspected.evidence.url.value);
  assert.notEqual(inspected.evidence.moq.value, 0);
});
