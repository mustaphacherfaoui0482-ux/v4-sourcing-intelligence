import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourceAdapter, normalizeSourceProduct } from '../modules/source-adapter.js';

test('source adapter exposes registered providers without coupling to Alibaba', () => {
  const adapter = createSourceAdapter({
    demo: {
      search: async (query) => [{ product: query, reference: 'demo-1' }],
      inspectProduct: async (reference) => ({ product: 'Demo Product', url: `https://example.test/${reference}` }),
    },
  });

  assert.deepEqual(adapter.listSources(), ['demo']);
});

test('source adapter delegates search and inspection', async () => {
  const adapter = createSourceAdapter({
    demo: {
      search: async (query) => [{ product: query }],
      inspectProduct: async (reference) => ({ product: reference }),
    },
  });

  assert.deepEqual(await adapter.searchSource('demo', 'thermal camera'), [{ product: 'thermal camera' }]);
  assert.deepEqual(await adapter.inspectSourceProduct('demo', 'p1'), { product: 'p1' });
});

test('normalization preserves missing economics as null and records evidence', () => {
  const result = normalizeSourceProduct(
    { product: 'Demo', price: 19.5, moq: undefined },
    { source: 'demo', evidenceStatus: 'P2', observedAt: '2026-08-27T00:00:00Z' },
  );

  assert.equal(result.product.value, 'Demo');
  assert.equal(result.price.value, 19.5);
  assert.equal(result.moq.value, null);
  assert.equal(result.moq.evidenceStatus, 'P2');
  assert.equal(result.moq.source, 'demo');
});

test('adapter rejects unknown sources and invalid queries', async () => {
  const adapter = createSourceAdapter({ demo: { search: async () => [] } });
  await assert.rejects(() => adapter.searchSource('missing', 'x'), /Unknown or invalid source/);
  await assert.rejects(() => adapter.searchSource('demo', ''), /query must be a non-empty string/);
});
