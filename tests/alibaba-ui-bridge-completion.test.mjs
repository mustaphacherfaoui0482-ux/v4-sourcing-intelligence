import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../modules/alibaba-ui-bridge.js', import.meta.url), 'utf8');

test('completion remount strategy uses a next-frame render after runtime sync', () => {
  assert.match(source, /requestAnimationFrame\(\(\) => mountManualCompletion\(opportunity\)\)/);
  assert.match(source, /function remountCompletion\(opportunity\)/);
});
