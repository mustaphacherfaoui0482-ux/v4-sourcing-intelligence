import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAlibabaThroughPiloterr, normalizePiloterrProduct } from '../api/alibaba-piloterr.js';

test('Piloterr Alibaba response normalizes title, price, MOQ and supplier without inventing values', () => {
  const result = normalizePiloterrProduct({
    product: {
      product_id: 1601175379813,
      title: 'Custom Product',
      url: 'https://www.alibaba.com/product-detail/Custom-Product_1601175379813.html',
      price: {
        min: 2.4,
        max: 4.8,
        quantity_prices: [{ min_quantity: 100, price: 2.4 }],
      },
      seller: { company_name: 'Example Factory', country: 'CN' },
    },
  });
  assert.equal(result.product, 'Custom Product');
  assert.equal(result.displayedPrice, 2.4);
  assert.equal(result.moq, 100);
  assert.equal(result.supplier, 'Example Factory');
  assert.equal(result.supplierCountry, 'CN');
  assert.equal(result.providerProductId, 1601175379813);
});

test('Piloterr Alibaba response keeps missing economics null', () => {
  const result = normalizePiloterrProduct({ product: { title: 'Unknown Product', seller: {} } });
  assert.equal(result.product, 'Unknown Product');
  assert.equal(result.displayedPrice, null);
  assert.equal(result.moq, null);
  assert.equal(result.supplier, null);
  assert.equal(result.supplierCountry, null);
});

test('Piloterr resolves Alibaba short product URLs to a canonical product URL before calling the product endpoint', async () => {
  const previousKey = process.env.PILOTERR_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.PILOTERR_API_KEY = 'test-key';
  const calls = [];

  globalThis.fetch = async (input, options = {}) => {
    const target = String(input);
    calls.push({ target, options });
    if (target === 'https://www.alibaba.com/x/1lB7erD?ck=pdp') {
      return new Response('<link rel="canonical" href="https://www.alibaba.com/product-detail/Test-Product_1601175379813.html">', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    }
    assert.equal(target, 'https://api.piloterr.com/v2/alibaba/product?query=https%3A%2F%2Fwww.alibaba.com%2Fproduct-detail%2FTest-Product_1601175379813.html');
    return new Response(JSON.stringify({ product: { title: 'Test Product', price: { min: 2.4 }, seller: {} } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const result = await fetchAlibabaThroughPiloterr('https://www.alibaba.com/x/1lB7erD?ck=pdp');
    assert.equal(result.targetUrl, 'https://www.alibaba.com/product-detail/Test-Product_1601175379813.html');
    assert.equal(result.extracted.product, 'Test Product');
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.PILOTERR_API_KEY;
    else process.env.PILOTERR_API_KEY = previousKey;
  }
});
