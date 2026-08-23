import test from 'node:test';
import assert from 'node:assert/strict';
import { isAlibabaHostname, normalizeAlibabaUrl, parseAlibabaProductHtml } from '../modules/alibaba-parser.js';

test('Alibaba URL validation accepts HTTPS Alibaba product URLs only', () => {
  assert.equal(normalizeAlibabaUrl('https://www.alibaba.com/product-detail/example.html'), 'https://www.alibaba.com/product-detail/example.html');
  assert.equal(normalizeAlibabaUrl('http://www.alibaba.com/product-detail/example.html'), null);
  assert.equal(normalizeAlibabaUrl('https://example.com/product.html'), null);
  assert.equal(isAlibabaHostname('www.alibaba.com'), true);
  assert.equal(isAlibabaHostname('evil-alibaba.com'), false);
});

test('Alibaba parser extracts explicit JSON-LD product and offer values', () => {
  const html = `<!doctype html><html><head><script type="application/ld+json">${JSON.stringify({
    '@type': 'Product',
    name: 'Portable LED Lamp',
    offers: { price: '4.80', priceCurrency: 'USD' },
    brand: { name: 'Example Factory' },
  })}</script></head><body></body></html>`;
  const parsed = parseAlibabaProductHtml(html);
  assert.equal(parsed.product, 'Portable LED Lamp');
  assert.equal(parsed.displayedPrice, 4.8);
  assert.equal(parsed.supplier, 'Example Factory');
});

test('Alibaba parser leaves missing values null instead of inventing them', () => {
  const parsed = parseAlibabaProductHtml('<html><head><title>Alibaba</title></head><body>Access denied</body></html>');
  assert.equal(parsed.product, 'Alibaba');
  assert.equal(parsed.displayedPrice, null);
  assert.equal(parsed.moq, null);
  assert.equal(parsed.supplier, null);
  assert.equal(parsed.supplierCountry, null);
});
