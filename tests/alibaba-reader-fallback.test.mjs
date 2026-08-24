import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReaderProxyUrl, fetchAlibabaThroughReader } from '../api/alibaba-reader-fallback.js';

test('Alibaba reader fallback preserves only valid Alibaba HTTPS URLs', () => {
  assert.equal(buildReaderProxyUrl('https://www.alibaba.com/product-detail/example.html'), 'https://r.jina.ai/https://www.alibaba.com/product-detail/example.html');
  assert.equal(buildReaderProxyUrl('https://www.alibaba.com/x/1lB7erD?ck=pdp'), 'https://r.jina.ai/https://www.alibaba.com/x/1lB7erD?ck=pdp');
  assert.equal(buildReaderProxyUrl('http://www.alibaba.com/product-detail/example.html'), null);
  assert.equal(buildReaderProxyUrl('https://example.com/product.html'), null);
});

test('Alibaba reader uses JSON POST first and preserves the complete target URL', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response('# Product\n\nPrice: 9.5', { status: 200, headers: { 'content-type': 'text/markdown' } });
  };
  try {
    const target = 'https://www.alibaba.com/x/1lB7erD?ck=pdp';
    const result = await fetchAlibabaThroughReader(target);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].url, 'https://r.jina.ai/');
    assert.equal(calls[0].options.headers['content-type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[0].options.body), { url: target });
    assert.equal(result.acquisition, 'JINA_READER');
    assert.equal(result.targetUrl, target);
  } finally { globalThis.fetch = originalFetch; }
});

test('Alibaba reader falls back to GET when JSON POST fails', async () => {
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
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[1].options.method, 'GET');
    assert.equal(calls[1].url, 'https://r.jina.ai/https://www.alibaba.com/x/1lB7erD?ck=pdp');
    assert.equal(result.acquisition, 'JINA_READER');
  } finally { globalThis.fetch = originalFetch; }
});
