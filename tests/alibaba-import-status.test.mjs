import test from 'node:test';
import assert from 'node:assert/strict';
import { extractionStatus } from '../api/alibaba-import.js';

test('Alibaba page retrieved with no product data is EMPTY, not extracted', () => {
  assert.equal(extractionStatus({
    product: null,
    displayedPrice: null,
    moq: null,
    supplier: null,
    supplierCountry: null,
  }), 'EMPTY');
});

test('Alibaba partial extraction is PARTIAL', () => {
  assert.equal(extractionStatus({
    product: 'Example Product',
    displayedPrice: 4.8,
    moq: null,
    supplier: null,
    supplierCountry: null,
  }), 'PARTIAL');
});

test('Alibaba complete extraction is COMPLETE', () => {
  assert.equal(extractionStatus({
    product: 'Example Product',
    displayedPrice: 4.8,
    moq: 100,
    supplier: 'Example Factory',
    supplierCountry: 'China',
  }), 'COMPLETE');
});
