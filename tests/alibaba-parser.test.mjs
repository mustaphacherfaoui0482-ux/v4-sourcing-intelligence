import test from 'node:test';
import assert from 'node:assert/strict';
import { isAlibabaHostname, normalizeAlibabaUrl, parseAlibabaProductHtml } from '../modules/alibaba-parser.js';

test('Alibaba URL validation accepts HTTPS Alibaba product URLs only', () => {
  assert.equal(normalizeAlibabaUrl('https://www.alibaba.com/product-detail/example.html'), 'https://www.alibaba.com/product-detail/example.html');
  assert.equal(normalizeAlibabaUrl('https://www.alibaba.com/x/1lB7W0u?ck=pdp'), 'https://www.alibaba.com/x/1lB7W0u?ck=pdp');
  assert.equal(normalizeAlibabaUrl('https://germany.alibaba.com/product-detail/example.html'), 'https://germany.alibaba.com/product-detail/example.html');
  assert.equal(normalizeAlibabaUrl('https://wholesaler.alibaba.com/product-detail/example.html'), 'https://wholesaler.alibaba.com/product-detail/example.html');
  assert.equal(normalizeAlibabaUrl('http://www.alibaba.com/product-detail/example.html'), null);
  assert.equal(normalizeAlibabaUrl('https://example.com/product.html'), null);
  assert.equal(isAlibabaHostname('www.alibaba.com'), true);
  assert.equal(isAlibabaHostname('evil-alibaba.com'), false);
});

test('Alibaba parser extracts explicit JSON-LD product and offer values', () => {
  const html = `<!doctype html><html><head><script type="application/ld+json">${JSON.stringify({
    '@type': 'Product', name: 'Portable LED Lamp', offers: { price: '4.80', priceCurrency: 'USD' }, brand: { name: 'Example Factory' },
  })}</script></head><body></body></html>`;
  const parsed = parseAlibabaProductHtml(html);
  assert.equal(parsed.product, 'Portable LED Lamp');
  assert.equal(parsed.displayedPrice, 4.8);
  assert.equal(parsed.supplier, 'Example Factory');
});

test('Alibaba parser extracts embedded product state used by dynamic pages', () => {
  const state = JSON.stringify({ productName: 'Rechargeable LED Work Light', price: '3.47', minOrderQuantity: 100, supplierName: 'Example Factory', supplierCountry: 'China' });
  const html = `<html><body><script>${state}</script></body></html>`;
  const parsed = parseAlibabaProductHtml(html);
  assert.equal(parsed.product, 'Rechargeable LED Work Light');
  assert.equal(parsed.displayedPrice, 3.47);
  assert.equal(parsed.moq, 100);
  assert.equal(parsed.supplier, 'Example Factory');
  assert.equal(parsed.supplierCountry, 'China');
  assert.equal(parsed.parserStatus, 'PARTIAL_OR_COMPLETE');
});

test('Alibaba parser extracts JSON embedded in a dynamic script assignment', () => {
  const html = `<script>window.__INITIAL_STATE__ = ${JSON.stringify({ productName: 'Wrapped Hoodie', price: '7.01', minOrderQuantity: 25, supplierName: 'GRIPTIGHT FITNESS', supplierCountry: 'China' })};</script>`;
  const parsed = parseAlibabaProductHtml(html);
  assert.equal(parsed.product, 'Wrapped Hoodie');
  assert.equal(parsed.displayedPrice, 7.01);
  assert.equal(parsed.moq, 25);
  assert.equal(parsed.supplier, 'GRIPTIGHT FITNESS');
  assert.equal(parsed.supplierCountry, 'China');
});

test('Alibaba parser extracts explicit key values even when the JSON wrapper is not parseable', () => {
  const html = `<script>window.runParams = {broken: true}; "productName":"Fallback Product","price":"4.80","minOrderQuantity":50,"supplierName":"Fallback Factory";</script>`;
  const parsed = parseAlibabaProductHtml(html);
  assert.equal(parsed.product, 'Fallback Product');
  assert.equal(parsed.displayedPrice, 4.8);
  assert.equal(parsed.moq, 50);
  assert.equal(parsed.supplier, 'Fallback Factory');
});

test('Alibaba parser accepts reversed meta attribute order', () => {
  const html = '<html><head><meta content="Portable Mini Fan" property="og:title"><meta content="4.80" property="product:price:amount"></head></html>';
  const parsed = parseAlibabaProductHtml(html);
  assert.equal(parsed.product, 'Portable Mini Fan');
  assert.equal(parsed.displayedPrice, 4.8);
});

test('Alibaba parser leaves missing values null instead of inventing them', () => {
  const parsed = parseAlibabaProductHtml('<html><head><title>Alibaba</title></head><body>Access denied</body></html>');
  assert.equal(parsed.product, null);
  assert.equal(parsed.displayedPrice, null);
  assert.equal(parsed.moq, null);
  assert.equal(parsed.supplier, null);
  assert.equal(parsed.supplierCountry, null);
  assert.equal(parsed.parserStatus, 'NO_STRUCTURED_DATA');
});
