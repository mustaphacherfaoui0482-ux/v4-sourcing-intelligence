import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBrightDataAlibabaCsv } from '../modules/brightdata-alibaba-csv.js';

const csv = `url,item_id,variant_id,title,description,product_category,brand,image_url,price,sale_price,availability,store_name,seller_url,target_countries,store_country,star_rating,review_count,variant_attributes
"[https://www.alibaba.com/product-detail/Test_100.html](https://www.alibaba.com/product-detail/Test_100.html)","100","200","Test Product","Description","Apparel","Test Brand","[https://example.com/a.jpg](https://example.com/a.jpg)","$15.00","","in_stock","Test Supplier","[https://supplier.example](https://supplier.example)","[""US""]","US","0","0","[{""name"":""Color"",""value"":""Black""}]"
`;

test('maps a Bright Data Alibaba CSV row into a V4 opportunity', () => {
  const result = parseBrightDataAlibabaCsv(csv);
  assert.equal(result.ok, true);
  assert.equal(result.rowCount, 1);
  assert.equal(result.validOpportunityCount, 1);
  const opportunity = result.opportunities[0];
  assert.equal(opportunity.product, 'Test Product');
  assert.equal(opportunity.source, 'Alibaba.com');
  assert.equal(opportunity.offer.supplierPrice, 15);
  assert.equal(opportunity.country, 'US');
  assert.equal(opportunity.isDemo, false);
  assert.equal(opportunity.evidenceLevel, 'P1');
  assert.equal(opportunity.confidence, null);
  assert.equal(opportunity.potential, null);
  assert.equal(opportunity.offer.landedCost, null);
  assert.equal(opportunity.offer.cac, null);
  assert.equal(opportunity.evidence.sourceProvider, 'Bright Data');
  assert.equal(opportunity.evidence.itemId, '100');
  assert.deepEqual(opportunity.evidence.variantAttributes, [{ name: 'Color', value: 'Black' }]);
});

test('preserves UNKNOWN instead of converting missing numeric values to zero', () => {
  const result = parseBrightDataAlibabaCsv(csv);
  const opportunity = result.opportunities[0];
  assert.equal(opportunity.offer.supplierPrice, 15);
  assert.equal(opportunity.offer.landedCost, null);
  assert.equal(opportunity.offer.salePrice, null);
  assert.equal(opportunity.offer.variableFees, null);
  assert.equal(opportunity.confidence, null);
  assert.equal(opportunity.potential, null);
});

test('rejects a CSV missing required Bright Data columns', () => {
  const result = parseBrightDataAlibabaCsv('url,title\n"https://example.com","Product"');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'missing_required_headers');
  assert.deepEqual(result.missingHeaders, ['item_id', 'price', 'store_name']);
});

test('supports quoted fields containing commas and newlines', () => {
  const input = `url,item_id,title,price,store_name\n"https://www.alibaba.com/product-detail/Test.html","1","Product, with newline\ninside","$2.50","Supplier"`;
  const result = parseBrightDataAlibabaCsv(input);
  assert.equal(result.ok, true);
  assert.equal(result.opportunities[0].product, 'Product, with newline\ninside');
  assert.equal(result.opportunities[0].offer.supplierPrice, 2.5);
});
