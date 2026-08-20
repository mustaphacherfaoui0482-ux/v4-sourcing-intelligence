import { saveState, loadState, removeState } from './v4-persistence.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };

export function runPersistenceTests() {
  const name = '__test__';
  removeState(name);
  assert(loadState(name, 'fallback') === 'fallback', 'missing state should use fallback');
  assert(saveState(name, { product: 'demo' }).success, 'state should save');
  assert(loadState(name)?.product === 'demo', 'saved state should load');
  assert(removeState(name).success, 'state should delete');
  assert(loadState(name, 'fallback') === 'fallback', 'deleted state should use fallback');
  return true;
}
