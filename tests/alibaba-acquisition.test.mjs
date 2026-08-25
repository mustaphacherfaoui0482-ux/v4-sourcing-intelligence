import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireAlibabaProduct, acquisitionHasData, providerOrder } from '../api/alibaba-acquisition.js';

test('provider chain uses official API before browser and Jina when injected', async () => {
  const calls = [];
  const providers = [
    { name: 'ALIBABA_OPEN_API', fetch: async () => { calls.push('api'); return { extracted: { product: null, displayedPrice: null, moq: null, supplier: null, supplierCountry: null } }; } },
    { name: 'BROWSER', fetch: async () => { calls.push('browser'); return { extracted: { product: 'Browser product', displayedPrice: null, moq: null, supplier: null, supplierCountry: null } }; } },
    { name: 'JINA_READER', fetch: async () => { calls.push('jina'); return { extracted: { product: 'Jina product', displayedPrice: null, moq: null, supplier: null, supplierCountry: null } }; } },
  ];

  const result = await acquireAlibabaProduct('https://www.alibaba.com/product-detail/example_1600000000000.html', { providers });

  assert.deepEqual(calls, ['api', 'browser']);
  assert.equal(result.fetched.acquisition, 'BROWSER');
  assert.equal(result.acquisitionStatus, 'ACQUIRED');
  assert.deepEqual(result.acquisitionAttempts, [
    { provider: 'ALIBABA_OPEN_API', status: 'EMPTY' },
    { provider: 'BROWSER', status: 'DATA' },
  ]);
});

test('provider chain reaches Jina only after previous providers fail', async () => {
  const calls = [];
  const providers = [
    { name: 'ALIBABA_OPEN_API', fetch: async () => { calls.push('api'); throw new Error('not_configured'); } },
    { name: 'BROWSER', fetch: async () => { calls.push('browser'); throw new Error('browser_failed'); } },
    { name: 'JINA_READER', fetch: async () => { calls.push('jina'); return { acquisition: 'JINA_READER', html: 'No usable product data' }; } },
  ];

  const result = await acquireAlibabaProduct('https://www.alibaba.com/product-detail/example_1600000000000.html', { providers });

  assert.deepEqual(calls, ['api', 'browser', 'jina']);
  assert.equal(result.fetched, null);
  assert.equal(result.acquisitionStatus, 'UNKNOWN');
  assert.equal(result.acquisitionAttempts[0].status, 'ERROR');
  assert.equal(result.acquisitionAttempts[1].status, 'ERROR');
  assert.equal(result.acquisitionAttempts[2].status, 'EMPTY');
});

test('missing values remain missing and do not count as acquisition data', () => {
  assert.equal(acquisitionHasData({ extracted: { product: null, displayedPrice: null, moq: null, supplier: null, supplierCountry: null } }), false);
  assert.equal(acquisitionHasData({ extracted: { product: 'x', displayedPrice: null, moq: null, supplier: null, supplierCountry: null } }), true);
});

test('provider order is explicit and inspectable', () => {
  assert.deepEqual(providerOrder([
    { name: 'ALIBABA_OPEN_API' },
    { name: 'BROWSER' },
    { name: 'JINA_READER' },
  ]), ['ALIBABA_OPEN_API', 'BROWSER', 'JINA_READER']);
});
