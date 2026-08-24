import test from 'node:test';
import assert from 'node:assert/strict';
import { extractionStatus, mergeAlibabaExtraction } from '../api/alibaba-import.js';

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

test('Alibaba partial direct extraction is completed by missing reader fields without overwriting direct values', () => {
  const merged = mergeAlibabaExtraction(
    { product: 'Direct Product', displayedPrice: 9.5, moq: null, supplier: null, supplierCountry: null },
    { product: 'Reader Product', displayedPrice: 8.9, moq: 1, supplier: 'Foshan jintai zhengyu', supplierCountry: 'China' },
  );
  assert.equal(merged.product, 'Direct Product');
  assert.equal(merged.displayedPrice, 9.5);
  assert.equal(merged.moq, 1);
  assert.equal(merged.supplier, 'Foshan jintai zhengyu');
  assert.equal(merged.supplierCountry, 'China');
  assert.equal(extractionStatus(merged), 'COMPLETE');
});

test('Alibaba merge keeps missing values unknown when both sources lack them', () => {
  const merged = mergeAlibabaExtraction(
    { product: 'Example Product', displayedPrice: 4.8, moq: null, supplier: null, supplierCountry: null },
    { product: null, displayedPrice: null, moq: null, supplier: null, supplierCountry: null },
  );
  assert.equal(merged.moq, null);
  assert.equal(merged.supplier, null);
  assert.equal(extractionStatus(merged), 'PARTIAL');
});
