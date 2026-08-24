import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAlibabaReaderText } from '../modules/alibaba-reader-parser.js';

test('Reader text parser extracts Alibaba product fields with decimal price', () => {
  const parsed = parseAlibabaReaderText(`# Men's Athletic Jogging Pants\nPrice: US$ 4.80\nMOQ: 20 Pieces\nSupplier: Example Factory\nSupplier country: China`);
  assert.equal(parsed.product, "Men's Athletic Jogging Pants");
  assert.equal(parsed.displayedPrice, 4.8);
  assert.equal(parsed.moq, 20);
  assert.equal(parsed.supplier, 'Example Factory');
  assert.equal(parsed.supplierCountry, 'China');
});

test('Reader parser accepts Alibaba markdown labels with bold formatting and table separators', () => {
  const parsed = parseAlibabaReaderText(`## Men's Athletic Jogging Pants\n**Price:** US$ 4.80\n**MOQ:** 20 Pieces\n**Supplier:** Example Factory\n**Country of origin:** China`);
  assert.equal(parsed.product, "Men's Athletic Jogging Pants");
  assert.equal(parsed.displayedPrice, 4.8);
  assert.equal(parsed.moq, 20);
  assert.equal(parsed.supplier, 'Example Factory');
  assert.equal(parsed.supplierCountry, 'China');
});

test('Reader parser accepts price before label and decimal comma', () => {
  const parsed = parseAlibabaReaderText('Product: Portable LED Lamp\nUS$ 4,80\nMOQ - 50 pieces\nManufacturer - Example Factory');
  assert.equal(parsed.product, 'Portable LED Lamp');
  assert.equal(parsed.displayedPrice, 4.8);
  assert.equal(parsed.moq, 50);
  assert.equal(parsed.supplier, 'Example Factory');
});

test('Reader parser keeps unknown values null', () => {
  const parsed = parseAlibabaReaderText('Alibaba page retrieved\nNo product data available');
  assert.equal(parsed.product, null);
  assert.equal(parsed.displayedPrice, null);
  assert.equal(parsed.moq, null);
  assert.equal(parsed.supplier, null);
  assert.equal(parsed.supplierCountry, null);
  assert.equal(parsed.parserStatus, 'NO_STRUCTURED_DATA');
});
