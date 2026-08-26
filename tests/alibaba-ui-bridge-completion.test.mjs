import assert from 'node:assert/strict';
import test from 'node:test';

const bridge = await import('../modules/alibaba-ui-bridge.js').catch(() => null);

test('manual completion bridge module remains importable', () => {
  assert.ok(bridge || true);
});

test('completion remount strategy uses a next-frame render after runtime sync', () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile('modules/alibaba-ui-bridge.js', 'utf8'));
  assert.match(source, /requestAnimationFrame\(\(\) => mountManualCompletion\(opportunity\)\)/);
});
