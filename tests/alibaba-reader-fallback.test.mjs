import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReaderProxyUrl, fetchAlibabaThroughReader } from '../api/alibaba-reader-fallback.js';

test('Alibaba reader fallback preserves only valid Alibaba HTTPS URLs', () => {
  assert.equal(
    buildReaderProxyUrl('https://www.alibaba.com/product-detail/example.html'),
    'https://r.jina.ai/https://www.alibaba.com/product-detail/example.html',
  );
  assert.equal(
    buildReaderProxyUrl('https://www.alibaba.com/x/1lB7erD?ck=pdp'),
    'https://r.jina.ai/https://www.alibaba.com/x/1lB7erD?ck=pdp',
  );
  assert.equal(buildReaderProxyUrl('http://www.alibaba.com/product-detail/example.html'), null);
  assert.equal(buildReaderProxyUrl('https://example.com/product.html'), null);
});

test('Alibaba reader uses the canonical GET proxy first and preserves target query parameters', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response('# Product\n\nPrice: 9.5', { status: 200, headers: { 'content-type': 'text/markdown' } });
  };

  try {
    const result = await fetchAlibabaThroughReader('https://www.alibaba.com/x/1lB7erD?ck=pdp');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.method, 'GET');
    assert.equal(calls[0].url, 'https://r.jina.ai/https://www.alibaba.com/x/1lB7erD?ck=pdp');
    assert.equal(result.acquisition, 'JINA_READER');
    assert.equal(result.targetUrl, 'https://www.alibaba.com/x/1lB7erD?ck=pdp');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Alibaba reader falls back to POST when the canonical GET reader fails', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) return new Response('blocked', { status: 403 });
    return new Response('Product: Lampe LED portable\nPrice: 9.5', { status: 200, headers: { 'content-type': 'text/plain' } });
  };

  try {
    const result = await fetchAlibabaThroughReader('https://www.alibaba.com/x/1lB7erD?ck=pdp');
    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.method, 'GET');
    assert.equal(calls[1].options.method, 'POST');
    assert.equal(calls[1].url, 'https://r.jina.ai/');
    assert.match(String(calls[1].options.body), /url=https%3A%2F%2Fwww.alibaba.com%2Fx%2F1lB7erD%3Fck%3Dpdp/);
    assert.equal(result.acquisition, 'JINA_READER');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
