import test from 'node:test';
import assert from 'node:assert/strict';
import { SOURCING_TOOLS, executeSourcingTool } from '../api/gpt-sourcing.js';

test('Alibaba sourcing tools expose strict bounded contracts', () => {
  assert.equal(SOURCING_TOOLS.length, 2);
  assert.deepEqual(SOURCING_TOOLS.map((tool) => tool.name), ['search_alibaba', 'inspect_alibaba_product']);
  for (const tool of SOURCING_TOOLS) {
    assert.equal(tool.type, 'function');
    assert.equal(tool.strict, true);
    assert.equal(tool.parameters.additionalProperties, false);
  }
  assert.deepEqual(SOURCING_TOOLS[0].parameters.required, ['query', 'limit']);
  assert.deepEqual(SOURCING_TOOLS[1].parameters.required, ['url']);
  assert.equal(SOURCING_TOOLS[0].parameters.properties.limit.minimum, 1);
  assert.equal(SOURCING_TOOLS[0].parameters.properties.limit.maximum, 10);
});

test('unknown sourcing tools are rejected deterministically', async () => {
  await assert.rejects(
    () => executeSourcingTool('unknown_tool', {}, { headers: {} }),
    /Unknown sourcing tool/,
  );
});

test('Alibaba search tool does not fabricate a result when query is missing', async () => {
  const result = await executeSourcingTool('search_alibaba', { query: '', limit: 5 }, { headers: {} });
  assert.deepEqual(result, { ok: false, status: 'INVALID_ARGUMENT', error: 'query_required' });
});

test('Alibaba inspection rejects a non-Alibaba URL before acquisition', async () => {
  const result = await executeSourcingTool('inspect_alibaba_product', { url: 'https://example.com/product' }, { headers: {} });
  assert.deepEqual(result, { ok: false, status: 'INVALID_ARGUMENT', error: 'invalid_alibaba_url' });
});

test('Alibaba inspection does not fabricate a result when URL is missing', async () => {
  const result = await executeSourcingTool('inspect_alibaba_product', { url: '' }, { headers: {} });
  assert.deepEqual(result, { ok: false, status: 'INVALID_ARGUMENT', error: 'url_required' });
});
