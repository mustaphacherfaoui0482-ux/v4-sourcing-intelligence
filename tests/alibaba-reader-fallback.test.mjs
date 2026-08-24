import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReaderProxyUrl } from '../api/alibaba-reader-fallback.js';

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
