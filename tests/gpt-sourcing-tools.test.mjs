import test from 'node:test';
import assert from 'node:assert/strict';
import { SOURCING_TOOLS, executeSourcingTool } from '../api/gpt-sourcing.js';

test('Sourcing tools expose strict bounded contracts', () => {
  assert.equal(SOURCING_TOOLS.length, 3);
  assert.deepEqual(
    SOURCING_TOOLS.map((tool) => tool.name),
    ['list_sources', 'search_source', 'inspect_source_product'],
  );
  for (const tool of SOURCING_TOOLS) {
    assert.equal(tool.type, 'function');
    assert.equal(tool.strict, true);
    assert.equal(tool.parameters.additionalProperties, false);
  }
  assert.deepEqual(SOURCING_TOOLS[1].parameters.required, ['source', 'query', 'limit']);
  assert.deepEqual(SOURCING_TOOLS[2].parameters.required, ['source', 'url']);
  assert.equal(SOURCING_TOOLS[1].parameters.properties.limit.minimum, 1);
  assert.equal(SOURCING_TOOLS[1].parameters.properties.limit.maximum, 10);
});

test('unknown sourcing tools are rejected deterministically', async () => {
  await assert.rejects(
    () => executeSourcingTool('unknown_tool', {}, { headers: {} }),
    /Unknown sourcing tool/,
  );
});

test('source search does not fabricate a result when query is missing', async () => {
  const result = await executeSourcingTool('search_source', { source: 'alibaba', query: '', limit: 5 }, { headers: {} });
  assert.deepEqual(result, { ok: false, status: 'INVALID_ARGUMENT', error: 'query_required' });
});

test('source inspection rejects an unsupported source URL before acquisition', async () => {
  const result = await executeSourcingTool(
    'inspect_source_product',
    { source: 'alibaba', url: 'https://example.com/product' },
    { headers: {} },
  );
  assert.deepEqual(result, { ok: false, status: 'INVALID_ARGUMENT', error: 'unsupported_source_url' });
});

test('source inspection does not fabricate a result when URL is missing', async () => {
  const result = await executeSourcingTool('inspect_source_product', { source: 'alibaba', url: '' }, { headers: {} });
  assert.deepEqual(result, { ok: false, status: 'INVALID_ARGUMENT', error: 'url_required' });
});
