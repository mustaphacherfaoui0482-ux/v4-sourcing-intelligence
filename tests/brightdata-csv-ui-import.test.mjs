import test from 'node:test';
import assert from 'node:assert/strict';
import { mapBrightDataCsv, parseBrightDataCsv } from '../modules/alibaba-import.js';

const csv = `"url","item_id","variant_id","title","price","store_name","store_country","availability"\n"[https://www.alibaba.com/product-detail/Test_100.html?sku=200](https://www.alibaba.com/product-detail/Test_100.html?sku=200)","100","200","Test product, premium","$15.00","Test Supplier","US","in_stock"\n"[https://www.alibaba.com/product-detail/Test_101.html](https://www.alibaba.com/product-detail/Test_101.html)","101","","Second product","$0.73","Second Supplier","CN","in_stock"`;

test('parses Bright Data CSV with quoted commas and markdown URLs', () => {
  const rows = parseBrightDataCsv(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, 'Test product, premium');
  assert.equal(rows[0].item_id, '100');
});

test('maps Bright Data rows to V4 evidence without inventing missing economics', () => {
  const result = mapBrightDataCsv(csv);
  assert.equal(result.totalRows, 2);
  assert.equal(result.importedRows, 2);
  assert.equal(result.rejectedRows, 0);
  assert.equal(result.items[0].evidence.sourceUrl, 'https://www.alibaba.com/product-detail/Test_100.html?sku=200');
  assert.equal(result.items[0].evidence.displayedPrice, 15);
  assert.equal(result.items[0].evidence.supplier, 'Test Supplier');
  assert.equal(result.items[0].evidence.confidence, 'UNKNOWN');
  assert.equal(result.items[0].evidence.moq, null);
});

test('rejects CSV without Bright Data required columns', () => {
  assert.throws(() => parseBrightDataCsv('url,title\nhttps://www.alibaba.com/product-detail/x.html,X'), /Colonnes Bright Data manquantes/);
});
