import test from 'node:test';
import assert from 'node:assert/strict';
import { getSourcingSource, listSourcingSources, resolveSource, SOURCE_STATUS } from '../modules/sourcing-source-registry.js';

test('source registry exposes Alibaba as optional adapter, not global dependency', () => {
  const source = getSourcingSource('alibaba');
  assert.equal(source.id, 'alibaba');
  assert.equal(source.optional, true);
  assert.equal(resolveSource('alibaba').status, SOURCE_STATUS.AVAILABLE);
});

test('unknown source is explicit and never silently mapped to Alibaba', () => {
  const result = resolveSource('unknown-source');
  assert.equal(result.status, SOURCE_STATUS.UNSUPPORTED);
  assert.equal(result.sourceId, 'unknown-source');
  assert.equal(listSourcingSources().some((source) => source.id === 'unknown-source'), false);
});

test('source registry is the single discovery surface for sourcing adapters', () => {
  const sources = listSourcingSources();
  assert.ok(Array.isArray(sources));
  assert.ok(sources.length >= 1);
  assert.ok(sources.every((source) => source.id && source.name && source.adapter));
});
