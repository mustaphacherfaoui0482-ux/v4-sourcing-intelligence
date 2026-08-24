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

test('Reader parser accepts common Alibaba min-order and company labels', () => {
  const parsed = parseAlibabaReaderText('Product Name: Portable LED Lamp\nPrice: US$ 4.80\nMin. Order Quantity: 100 Pieces\nCompany Name: Example Factory');
  assert.equal(parsed.moq, 100);
  assert.equal(parsed.supplier, 'Example Factory');
});

test('Reader parser accepts alternate seller, factory and MOQ labels', () => {
  const parsed = parseAlibabaReaderText('Product: Montre à Quartz Pour Homme\nPrice: 9.5\nMin order qty: 1\nFactory: Foshan jintai zhengyu\nCountry name: China');
  assert.equal(parsed.product, 'Montre à Quartz Pour Homme');
  assert.equal(parsed.displayedPrice, 9.5);
  assert.equal(parsed.moq, 1);
  assert.equal(parsed.supplier, 'Foshan jintai zhengyu');
  assert.equal(parsed.supplierCountry, 'China');
});

test('Reader parser extracts fields from a vertical Markdown table returned by the reader', () => {
  const parsed = parseAlibabaReaderText(`| Product Name | Portable LED Lamp |\n| --- | --- |\n| Price | US$ 4.80 |\n| MOQ | 100 Pieces |\n| Supplier | Example Factory |\n| Country of origin | China |`);
  assert.equal(parsed.product, 'Portable LED Lamp');
  assert.equal(parsed.displayedPrice, 4.8);
  assert.equal(parsed.moq, 100);
  assert.equal(parsed.supplier, 'Example Factory');
  assert.equal(parsed.supplierCountry, 'China');
});

test('Reader parser extracts fields from a horizontal Alibaba Markdown table', () => {
  const parsed = parseAlibabaReaderText(`| Product Name | Price | MOQ | Supplier | Country of origin |\n| --- | --- | --- | --- | --- |\n| Portable LED Lamp | US$ 4.80 | 100 Pieces | Example Factory | China |`);
  assert.equal(parsed.product, 'Portable LED Lamp');
  assert.equal(parsed.displayedPrice, 4.8);
  assert.equal(parsed.moq, 100);
  assert.equal(parsed.supplier, 'Example Factory');
  assert.equal(parsed.supplierCountry, 'China');
});

test('Reader parser accepts single-line labelled product blocks', () => {
  const parsed = parseAlibabaReaderText('Product Name: Portable LED Lamp Price: US$ 4.80 MOQ: 100 Pieces Supplier: Example Factory Country of origin: China');
  assert.equal(parsed.product, 'Portable LED Lamp');
  assert.equal(parsed.displayedPrice, 4.8);
  assert.equal(parsed.moq, 100);
  assert.equal(parsed.supplier, 'Example Factory');
  assert.equal(parsed.supplierCountry, 'China');
  assert.equal(parsed.parserStatus, 'PARTIAL_OR_COMPLETE');
});

test('Reader parser accepts compact Alibaba labels without newlines', () => {
  const parsed = parseAlibabaReaderText('Product: Montre à Quartz Pour Homme Price: 9.5 MOQ: 1 Supplier: Foshan jintai zhengyu Country: China');
  assert.equal(parsed.product, 'Montre à Quartz Pour Homme');
  assert.equal(parsed.displayedPrice, 9.5);
  assert.equal(parsed.moq, 1);
  assert.equal(parsed.supplier, 'Foshan jintai zhengyu');
  assert.equal(parsed.supplierCountry, 'China');
});

test('Reader parser accepts Alibaba labels whose values are on the next line', () => {
  const parsed = parseAlibabaReaderText(`Product Name\n450GSM Heavyweight Custom Cropped Zip-up Hoodie\nPrice\nUS$ 12.80\nMOQ\n50 Pieces\nSupplier\nExample Factory\nCountry of origin\nChina`);
  assert.equal(parsed.product, '450GSM Heavyweight Custom Cropped Zip-up Hoodie');
  assert.equal(parsed.displayedPrice, 12.8);
  assert.equal(parsed.moq, 50);
  assert.equal(parsed.supplier, 'Example Factory');
  assert.equal(parsed.supplierCountry, 'China');
  assert.equal(parsed.parserStatus, 'PARTIAL_OR_COMPLETE');
});

test('Reader parser accepts bullet labels whose values are on the next line', () => {
  const parsed = parseAlibabaReaderText(`- Product Name\n- 450GSM Heavyweight Custom Cropped Zip-up Hoodie\n- Price\n- US$ 12.80\n- MOQ\n- 50 Pieces\n- Supplier\n- Example Factory`);
  assert.equal(parsed.product, '450GSM Heavyweight Custom Cropped Zip-up Hoodie');
  assert.equal(parsed.displayedPrice, 12.8);
  assert.equal(parsed.moq, 50);
  assert.equal(parsed.supplier, 'Example Factory');
});

test('Reader parser ignores generic reader headings', () => {
  const parsed = parseAlibabaReaderText('# Alibaba.com\n## Product Details\nNo product data available');
  assert.equal(parsed.product, null);
  assert.equal(parsed.parserStatus, 'NO_STRUCTURED_DATA');
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
