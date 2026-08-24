import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePiloterrProduct } from '../api/alibaba-piloterr.js';

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
