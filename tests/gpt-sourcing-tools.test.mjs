import test from 'node:test';
import assert from 'node:assert/strict';
import { SOURCING_TOOLS, executeSourcingTool } from '../api/gpt-sourcing.js';

test('Alibaba search tool exposes a strict bounded query contract', () => {
  assert.equal(SOURCING_TOOLS.length, 1);
  const tool = SOURCING_TOOLS[0];
  assert.equal(tool.type, 'function');
  assert.equal(tool.name, 'search_alibaba');
  assert.equal(tool.strict, true);
  assert.deepEqual(tool.parameters.required, ['query', 'limit']);
  assert.equal(tool.parameters.additionalProperties, false);
  assert.equal(tool.parameters.properties.limit.minimum, 1);
  assert.equal(tool.parameters.properties.limit.maximum, 10);
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
